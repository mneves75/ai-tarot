/**
 * Redirect Path Validation Utilities
 *
 * CRIT-5 FIX: Open Redirect Prevention
 *
 * Validates redirect paths to prevent open redirect attacks where
 * an attacker crafts a URL like: /auth/callback?next=//evil.com
 *
 * @module lib/utils/security/redirect-validation
 */

/**
 * Allowlist of valid redirect path prefixes.
 * Only paths starting with these prefixes are allowed.
 */
export const ALLOWED_REDIRECT_PREFIXES = [
  "/", // Root and all internal paths
];

/**
 * Denylist of dangerous redirect patterns.
 * These are checked AFTER the prefix check as a defense-in-depth measure.
 */
// biome-ignore lint/suspicious/noControlCharactersInRegex: Intentionally matching null bytes for security
const NULL_BYTE_PATTERN = /\x00/;

export const DANGEROUS_PATTERNS: RegExp[] = [
  /^\/\//, // Protocol-relative URLs (//evil.com)
  /^\/\\/, // Backslash after slash (/\evil.com)
  /:\/\//, // Protocols (http://, https://, javascript://)
  /%2f%2f/i, // URL-encoded double slash
  /%5c/i, // URL-encoded backslash
  NULL_BYTE_PATTERN, // Null bytes - security critical
  /@/, // Credentials in URL (@)
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
export function validateRedirectPath(path: string | null): string {
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
  // This catches edge cases like:
  // - /. or /.. (relative path traversal)
  // - /.evil.com (could be interpreted as domain by some browsers)
  // A valid internal path should start with an alphanumeric segment
  const firstSegment = decodedPath.split("/")[1] ?? "";
  if (firstSegment.startsWith(".") || firstSegment === "") {
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

/**
 * Sanitize a forwarded host header to prevent header injection attacks.
 *
 * @param host - The x-forwarded-host header value
 * @returns Sanitized host with only safe characters
 */
export function sanitizeForwardedHost(host: string | null): string | null {
  if (!host) return null;
  // Only allow alphanumeric, dots, and hyphens (valid hostname chars)
  return host.replace(/[^\w.-]/g, "");
}
