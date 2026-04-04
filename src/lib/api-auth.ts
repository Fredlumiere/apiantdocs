import { createServerClient } from "./supabase";
import { NextRequest } from "next/server";

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
 * Checks if a request has write permission.
 */
export async function requireWriteAccess(
  request: NextRequest
): Promise<{ authorized: boolean; error?: string }> {
  const authHeader = request.headers.get("authorization");
  if (authHeader === `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`) {
    return { authorized: true };
  }

  const permissions = await validateApiKey(request);
  if (!permissions) return { authorized: false, error: "Invalid API key" };
  if (!permissions.includes("write") && !permissions.includes("admin")) {
    return { authorized: false, error: "Insufficient permissions" };
  }

  return { authorized: true };
}
