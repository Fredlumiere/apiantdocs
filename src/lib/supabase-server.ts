import { createServerClient as createSSRServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Server Supabase client that reads cookies for user session.
 * Use this in Server Components and Route Handlers for session-aware queries.
 * NOT the service-role client — respects RLS based on user session.
 */
export async function createAuthServerClient() {
  const cookieStore = await cookies();

  return createSSRServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // setAll is called from Server Components where cookies can't be set.
            // This is expected — the middleware handles refreshing.
          }
        },
      },
    }
  );
}

/**
 * Get the current user session from cookies.
 * Returns null if not authenticated.
 */
export async function getSession() {
  const supabase = await createAuthServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session;
}

/**
 * Get the current user from cookies.
 * Returns null if not authenticated.
 */
export async function getUser() {
  const supabase = await createAuthServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
