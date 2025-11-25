import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { getSupabaseEnv } from "@/lib/supabase/env";

/**
 * Middleware for refreshing Supabase auth session.
 *
 * SECURITY: This middleware is ONLY for session refresh.
 * NEVER use middleware for authentication or authorization checks.
 * All auth checks MUST happen in the Data Access Layer (DAL).
 *
 * Why middleware for session refresh?
 * - Server Components cannot write cookies
 * - We need to refresh the session on every request
 * - Without refresh, sessions will eventually expire
 *
 * @see src/lib/dal/index.ts for authentication
 */
export async function middleware(request: NextRequest) {
  // Create response that can be modified
  let supabaseResponse = NextResponse.next({
    request,
  });

  const { url, anonKey } = getSupabaseEnv();

  const supabase = createServerClient(
    url,
    anonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // First, set cookies on the request (for Server Components)
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          // Then, create a new response with updated cookies
          supabaseResponse = NextResponse.next({
            request,
          });
          // Finally, set cookies on the response (for the browser)
          for (const { name, value, options } of cookiesToSet) {
            supabaseResponse.cookies.set(name, value, options);
          }
        },
      },
    }
  );

  // IMPORTANT: Do not add auth checks here!
  // Just refresh the session - auth happens in DAL
  //
  // Do not call supabase.auth.getUser() here because:
  // 1. It makes an additional database call on every request
  // 2. Auth checks should happen in DAL (Data Access Layer)
  //
  // We call getSession() which only reads the cookie
  await supabase.auth.getSession();

  return supabaseResponse;
}

/**
 * Matcher configuration for middleware.
 *
 * We run middleware on all routes except:
 * - _next/static (static files)
 * - _next/image (image optimization files)
 * - favicon.ico (favicon file)
 * - Public files (images, robots.txt, etc.)
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - Public folder files
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
