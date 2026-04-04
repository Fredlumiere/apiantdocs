import { createBrowserClient as createSSRBrowserClient } from "@supabase/ssr";

/**
 * Browser Supabase client using @supabase/ssr for cookie-based auth.
 * Use this in Client Components for auth operations.
 */
export function createBrowserClient() {
  return createSSRBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
