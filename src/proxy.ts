import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { getSupabaseEnv } from "@/lib/supabase/env";

/**
 * Proxy for refreshing Supabase auth session.
 *
 * SECURITY: This is only for session refresh. AuthZ happens in DAL.
 */
export async function proxy(request: NextRequest) {
  // Create response that can be modified
  let supabaseResponse = NextResponse.next({
    request,
  });

  const { url, anonKey } = getSupabaseEnv();

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        // Update request cookies (for Server Components)
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        // Recreate response with updated request
        supabaseResponse = NextResponse.next({
          request,
        });
        // Set cookies on the response (browser)
        for (const { name, value, options } of cookiesToSet) {
          supabaseResponse.cookies.set(name, value, options);
        }
      },
    },
  });

  // Refresh session (no auth checks here)
  await supabase.auth.getSession();

  return supabaseResponse;
}

/**
 * Matcher configuration for proxy.
 */
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
