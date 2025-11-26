import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { auditLog, type AuditLogLevel } from "@/lib/audit/logger";
import {
  validateRedirectPath,
  sanitizeForwardedHost,
} from "@/lib/utils/security";

/**
 * Auth callback route handler for OAuth providers.
 *
 * This route handles the redirect from OAuth providers (Google, etc.)
 * after successful authentication. It exchanges the auth code for a session.
 *
 * Flow:
 * 1. User clicks "Sign in with Google"
 * 2. User authenticates with Google
 * 3. Google redirects to this callback with a code
 * 4. We exchange the code for a session
 * 5. User is redirected to the app
 *
 * @module app/auth/callback
 */

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const rawNext = requestUrl.searchParams.get("next");
  const origin = requestUrl.origin;

  // CRIT-5 FIX: Validate redirect path BEFORE any redirect
  const next = validateRedirectPath(rawNext);

  // Log if we blocked a potentially malicious redirect attempt
  if (rawNext && rawNext !== next) {
    await auditLog({
      event: "auth.redirect_blocked",
      level: "warn" as AuditLogLevel,
      userId: undefined,
      sessionId: undefined,
      resource: "auth",
      resourceId: undefined,
      action: "redirect_validate",
      success: false,
      errorMessage: "Blocked potentially malicious redirect",
      durationMs: undefined,
      metadata: {
        attemptedPath: rawNext.slice(0, 100), // Truncate for safety
        sanitizedPath: next,
      },
    });
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Redirect to the validated destination
      const forwardedHost = request.headers.get("x-forwarded-host");
      const isLocalEnv = process.env["NODE_ENV"] === "development";

      if (isLocalEnv) {
        // In local development, use the origin directly
        return NextResponse.redirect(`${origin}${next}`);
      } else if (forwardedHost) {
        // CRIT-5 FIX: Also validate forwardedHost to prevent header injection
        const sanitizedHost = sanitizeForwardedHost(forwardedHost);
        if (sanitizedHost) {
          return NextResponse.redirect(`https://${sanitizedHost}${next}`);
        }
        return NextResponse.redirect(`${origin}${next}`);
      } else {
        return NextResponse.redirect(`${origin}${next}`);
      }
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
}
