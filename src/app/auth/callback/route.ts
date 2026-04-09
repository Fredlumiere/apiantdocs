import { NextRequest, NextResponse } from "next/server";
import { createServerClient as createSSRServerClient } from "@supabase/ssr";

/**
 * Auth callback handler for magic links and OAuth.
 * Supabase redirects here with a code that we exchange for a session.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") || "/dashboard";
  // Prevent open redirect — only allow relative paths
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";

  if (code) {
    const response = NextResponse.redirect(new URL(safeNext, origin));

    const supabase = createSSRServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options);
            });
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // If this was a password reset, redirect to the reset-password page
      if (safeNext === "/reset-password" || safeNext.startsWith("/reset-password")) {
        return NextResponse.redirect(new URL("/reset-password", origin));
      }
      return response;
    }
  }

  // If no code or exchange failed, redirect to login with error
  return NextResponse.redirect(new URL("/login?error=auth_callback_failed", origin));
}
