import { createServerClient } from "./supabase";
import { NextRequest } from "next/server";
import { createServerClient as createSSRServerClient } from "@supabase/ssr";

/**
 * Validates an API key from the Authorization header.
 * Returns the permissions array if valid, null if invalid.
 */
export async function validateApiKey(
  request: NextRequest
): Promise<string[] | null> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ak_")) return null;

  const key = authHeader.slice(7); // Remove "Bearer "
  const prefix = key.slice(0, 11); // "ak_" + 8 chars

  const supabase = createServerClient();
  const { data } = await supabase
    .from("api_keys")
    .select("id, key_hash, permissions")
    .eq("key_prefix", prefix)
    .single();

  if (!data) return null;

  // Compare hash
  const encoder = new TextEncoder();
  const keyBuffer = encoder.encode(key);
  const hashBuffer = await crypto.subtle.digest("SHA-256", keyBuffer);
  const hashHex = Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  if (hashHex !== data.key_hash) return null;

  // Update last_used_at
  await supabase
    .from("api_keys")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", data.id);

  return data.permissions;
}

/**
 * Validates a Supabase session from cookies.
 * Returns the user ID if valid, null if not authenticated.
 */
export async function validateSession(
  request: NextRequest
): Promise<{ userId: string; permissions: string[] } | null> {
  // SECURITY: Do NOT trust x-supabase-user header — it can be spoofed.
  // Always validate session from cookies directly.
  try {
    const supabase = createSSRServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll() {
            // Can't set cookies in API route handler from here
          },
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      return { userId: user.id, permissions: ["read", "write"] };
    }
  } catch {
    // Session validation failed — not authenticated
  }

  return null;
}

/**
 * Checks if a request has write permission.
 * Supports: service role key, API key, or Supabase session.
 */
export async function requireWriteAccess(
  request: NextRequest
): Promise<{ authorized: boolean; error?: string }> {
  // 1. Service role key (admin)
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const authHeader = request.headers.get("authorization");
  if (serviceRoleKey && authHeader === `Bearer ${serviceRoleKey}`) {
    return { authorized: true };
  }

  // 2. API key
  const permissions = await validateApiKey(request);
  if (permissions) {
    if (!permissions.includes("write") && !permissions.includes("admin")) {
      return { authorized: false, error: "Insufficient permissions" };
    }
    return { authorized: true };
  }

  // 3. Supabase session (cookie-based)
  const session = await validateSession(request);
  if (session) {
    if (
      session.permissions.includes("write") ||
      session.permissions.includes("admin")
    ) {
      return { authorized: true };
    }
    return { authorized: false, error: "Insufficient permissions" };
  }

  return { authorized: false, error: "Authentication required" };
}
