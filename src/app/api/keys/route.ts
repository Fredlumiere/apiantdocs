import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { getUser } from "@/lib/supabase-server";

/**
 * GET /api/keys — list the authenticated user's API keys
 */
export async function GET() {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("api_keys")
    .select("id, name, key_prefix, permissions, created_at, last_used_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

/**
 * POST /api/keys — create a new API key for the authenticated user
 * Body: { name: string, permissions?: string[] }
 */
export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { name, permissions } = body;

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return NextResponse.json(
      { error: "Name is required" },
      { status: 400 }
    );
  }

  // Validate permissions
  const validPermissions = ["read", "write", "admin"];
  const perms: string[] = Array.isArray(permissions)
    ? permissions.filter((p: string) => validPermissions.includes(p))
    : ["read"];

  if (perms.length === 0) {
    perms.push("read");
  }

  // Generate random key: ak_ + 32 random chars
  const randomBytes = new Uint8Array(24);
  crypto.getRandomValues(randomBytes);
  const randomChars = Array.from(randomBytes)
    .map((b) => b.toString(36).padStart(2, "0"))
    .join("")
    .slice(0, 32);
  const fullKey = `ak_${randomChars}`;
  const keyPrefix = fullKey.slice(0, 11); // "ak_" + 8 chars

  // Hash the key
  const encoder = new TextEncoder();
  const keyBuffer = encoder.encode(fullKey);
  const hashBuffer = await crypto.subtle.digest("SHA-256", keyBuffer);
  const keyHash = Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("api_keys")
    .insert({
      name: name.trim(),
      key_hash: keyHash,
      key_prefix: keyPrefix,
      permissions: perms,
      user_id: user.id,
    })
    .select("id, name, key_prefix, permissions, created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Return the full key ONCE — it's never stored in plaintext
  return NextResponse.json(
    {
      data: {
        ...data,
        key: fullKey,
      },
    },
    { status: 201 }
  );
}

/**
 * DELETE /api/keys — revoke an API key
 * Body: { id: string }
 */
export async function DELETE(request: NextRequest) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { id } = body;

  if (!id) {
    return NextResponse.json({ error: "Key ID is required" }, { status: 400 });
  }

  const supabase = createServerClient();

  // Verify the key belongs to this user
  const { data: existing } = await supabase
    .from("api_keys")
    .select("id")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!existing) {
    return NextResponse.json({ error: "API key not found" }, { status: 404 });
  }

  const { error } = await supabase.from("api_keys").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
