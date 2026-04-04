import { NextResponse, type NextRequest } from "next/server";
import { createServerClient as createSSRServerClient } from "@supabase/ssr";

/**
 * Middleware:
 * - Refreshes Supabase auth session on every request (keeps cookies fresh)
 * - Protects /dashboard/* routes — redirects to /login if no session
 * - Passes user ID to API routes via x-supabase-user header
 * - Does NOT protect /docs, /api/docs (public read), /login, /signup, /auth/*
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createSSRServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Update request cookies for downstream server components
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          // Create a new response with updated request headers
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          // Set cookies on the response
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Refresh session — this keeps the cookie alive
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Protect /dashboard routes
  if (pathname.startsWith("/dashboard")) {
    if (!user) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // If user is authenticated and visiting /login or /signup, redirect to dashboard
  if (user && (pathname === "/login" || pathname === "/signup")) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Add CORS headers to all API routes
  if (pathname.startsWith("/api/")) {
    response.headers.set("Access-Control-Allow-Origin", "*");
    response.headers.set("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
    response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Changed-By");
  }

  // Pass user ID to API routes via header (for session-based API auth)
  if (user && pathname.startsWith("/api/")) {
    response.headers.set("x-supabase-user", user.id);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public files (images, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
