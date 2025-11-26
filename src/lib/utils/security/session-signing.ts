/**
 * Session Cookie Signing Utilities
 *
 * CRIT-4 FIX: Guest Session Cookie Hijacking Prevention
 *
 * Provides HMAC-SHA256 signing and verification for session cookies
 * to prevent session enumeration and forging attacks.
 *
 * @module lib/utils/security/session-signing
 */

import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Secret key for HMAC signing of guest session cookies.
 * In production, this MUST be set via environment variable.
 *
 * SECURITY: Without this, attackers can enumerate or forge session IDs.
 */
const DEFAULT_SECRET = "development-only-secret-change-in-production";

/**
 * Sign a session ID with HMAC-SHA256.
 * Returns format: "{sessionId}.{signature}"
 *
 * @param sessionId - The UUID session ID
 * @param secret - Optional secret key (defaults to env var or dev secret)
 * @returns Signed session token
 */
export function signSessionId(
  sessionId: string,
  secret: string = process.env["GUEST_SESSION_SECRET"] ?? DEFAULT_SECRET
): string {
  const signature = createHmac("sha256", secret)
    .update(sessionId)
    .digest("hex")
    .slice(0, 32); // 32 hex chars = 128 bits, sufficient for integrity

  return `${sessionId}.${signature}`;
}

/**
 * Verify and extract session ID from a signed token.
 * Uses timing-safe comparison to prevent timing attacks.
 *
 * @param signedToken - The signed session token from cookie
 * @param secret - Optional secret key (defaults to env var or dev secret)
 * @returns The session ID if valid, null otherwise
 */
export function verifyAndExtractSessionId(
  signedToken: string,
  secret: string = process.env["GUEST_SESSION_SECRET"] ?? DEFAULT_SECRET
): string | null {
  const parts = signedToken.split(".");
  if (parts.length !== 2) {
    return null;
  }

  const [sessionId, signature] = parts;
  if (!(sessionId && signature) || signature.length !== 32) {
    return null;
  }

  // Compute expected signature
  const expectedSignature = createHmac("sha256", secret)
    .update(sessionId)
    .digest("hex")
    .slice(0, 32);

  // Timing-safe comparison to prevent timing attacks
  try {
    const signatureBuffer = Buffer.from(signature, "hex");
    const expectedBuffer = Buffer.from(expectedSignature, "hex");

    if (signatureBuffer.length !== expectedBuffer.length) {
      return null;
    }

    if (!timingSafeEqual(signatureBuffer, expectedBuffer)) {
      return null;
    }

    return sessionId;
  } catch {
    // Buffer.from can throw on invalid hex
    return null;
  }
}

/**
 * Check if a token has a valid format (without verifying signature).
 * Useful for quick rejection of malformed tokens before signature check.
 *
 * @param token - The token to check
 * @returns True if the token has valid format
 */
export function hasValidTokenFormat(token: string): boolean {
  const parts = token.split(".");
  if (parts.length !== 2) return false;

  const [sessionId, signature] = parts;
  if (!(sessionId && signature)) return false;

  // Signature should be 32 hex chars
  if (signature.length !== 32) return false;

  // Signature should be valid hex
  if (!/^[a-f0-9]+$/i.test(signature)) return false;

  return true;
}
