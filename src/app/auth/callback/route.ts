import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { auditLog, type AuditLogLevel } from "@/lib/audit/logger";

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

// ============================================================
// CRIT-5 FIX: OPEN REDIRECT PREVENTION
// ============================================================

/**
 * Allowlist of valid redirect path prefixes.
 * Only paths starting with these prefixes are allowed.
 */
const ALLOWED_REDIRECT_PREFIXES = [
  "/",           // Root and all internal paths
];

/**
 * Denylist of dangerous redirect patterns.
 * These are checked AFTER the prefix check as a defense-in-depth measure.
 */
const DANGEROUS_PATTERNS = [
  /^\/\//,              // Protocol-relative URLs (//evil.com)
  /^\/\\/,              // Backslash after slash (/\evil.com)
  /:\/\//,              // Protocols (http://, https://, javascript://)
  /%2f%2f/i,            // URL-encoded double slash
  /%5c/i,               // URL-encoded backslash
  /\x00/,               // Null bytes
  /@/,                  // Credentials in URL (@)
];

/**
 * Validate a redirect path to prevent open redirect attacks.
 *
 * SECURITY: This is critical for preventing phishing attacks where
 * an attacker crafts a URL like:
 *   /auth/callback?code=xxx&next=//evil.com
 *
 * The validation ensures:
 * 1. Path must start with exactly one forward slash
 * 2. Path cannot contain protocol markers or special characters
 * 3. Path must be a valid relative path within our domain
 *
 * @param path - The path to validate
 * @returns The sanitized path if valid, "/" otherwise
 */
function validateRedirectPath(path: string | null): string {
  // Default to home if no path provided
  if (!path) {
    return "/";
  }

  // Decode the path to catch encoded attacks
  let decodedPath: string;
  try {
    decodedPath = decodeURIComponent(path);
  } catch {
    // Invalid encoding - reject
    return "/";
  }

  // Must start with exactly one forward slash (internal path)
  if (!decodedPath.startsWith("/")) {
    return "/";
  }

  // Check against dangerous patterns
  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(decodedPath) || pattern.test(path)) {
      return "/";
    }
  }

  // Additional validation: ensure the first path segment is valid
  // This catches edge cases like /. or /.. or paths that could be
  // interpreted as relative by some browsers
  const firstSegment = decodedPath.split("/")[1] ?? "";
  if (firstSegment === "." || firstSegment === "..") {
    return "/";
  }

  // Verify it matches our allowlist
  const isAllowed = ALLOWED_REDIRECT_PREFIXES.some((prefix) =>
    decodedPath.startsWith(prefix)
  );

  if (!isAllowed) {
    return "/";
  }

  // Path is safe - use the original (not decoded) to preserve encoding
  return path;
}

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
        const sanitizedHost = forwardedHost.replace(/[^\w.-]/g, "");
        return NextResponse.redirect(`https://${sanitizedHost}${next}`);
      } else {
        return NextResponse.redirect(`${origin}${next}`);
      }
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
}
