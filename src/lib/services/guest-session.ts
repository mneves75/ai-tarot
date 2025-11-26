import "server-only";
import { cookies } from "next/headers";
import { cache } from "react";
import { createHmac, timingSafeEqual } from "node:crypto";
import { eq, and, isNull, gt, sql, lt } from "drizzle-orm";
import { db } from "@/lib/db";
import { guestSessions } from "@/lib/db/schema";
import {
  GUEST_SESSION_COOKIE,
  GUEST_SESSION_DURATION_MS,
  FREE_GUEST_READINGS,
} from "@/lib/config/constants";
import { auditLog, type AuditLogLevel } from "@/lib/audit/logger";

// ============================================================
// CRIT-4 FIX: HMAC SIGNING FOR GUEST SESSION COOKIES
// ============================================================

/**
 * Secret key for HMAC signing of guest session cookies.
 * In production, this MUST be set via environment variable.
 *
 * SECURITY: Without this, attackers can enumerate or forge session IDs.
 */
const GUEST_SESSION_SECRET = process.env["GUEST_SESSION_SECRET"] ?? "development-only-secret-change-in-production";

/**
 * Sign a session ID with HMAC-SHA256.
 * Returns format: "{sessionId}.{signature}"
 *
 * @param sessionId - The UUID session ID
 * @returns Signed session token
 */
function signSessionId(sessionId: string): string {
  const signature = createHmac("sha256", GUEST_SESSION_SECRET)
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
 * @returns The session ID if valid, null otherwise
 */
function verifyAndExtractSessionId(signedToken: string): string | null {
  const parts = signedToken.split(".");
  if (parts.length !== 2) {
    return null;
  }

  const [sessionId, signature] = parts;
  if (!sessionId || !signature || signature.length !== 32) {
    return null;
  }

  // Compute expected signature
  const expectedSignature = createHmac("sha256", GUEST_SESSION_SECRET)
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
 * Guest Session Service
 *
 * Manages guest sessions for unauthenticated users.
 * Guests get a limited number of free readings tracked via cookies.
 *
 * @module lib/services/guest-session
 */

export interface GuestSession {
  id: string;
  freeReadingsUsed: number;
  createdAt: Date;
  expiresAt: Date;
}

export interface GuestSessionStatus {
  session: GuestSession | null;
  remainingFreeReadings: number;
  canRead: boolean;
}

/**
 * Get or create a guest session for the current user.
 *
 * CRIT-4 FIX: Uses HMAC-signed cookies to prevent session enumeration/hijacking.
 * Uses React cache to prevent duplicate database calls per request.
 *
 * @returns The guest session or null if creation fails
 */
export const getOrCreateGuestSession = cache(
  async (): Promise<GuestSession | null> => {
    const cookieStore = await cookies();
    const existingSignedToken = cookieStore.get(GUEST_SESSION_COOKIE)?.value;

    // CRIT-4 FIX: Verify HMAC signature before using session ID
    if (existingSignedToken) {
      const sessionId = verifyAndExtractSessionId(existingSignedToken);

      if (sessionId) {
        const existingSession = await findValidSession(sessionId);
        if (existingSession) {
          return existingSession;
        }
      } else {
        // Invalid signature - possible tampering attempt
        await auditLog({
          event: "guest_session.invalid_signature",
          level: "warn" as AuditLogLevel,
          userId: undefined,
          sessionId: undefined,
          resource: "guest_session",
          resourceId: undefined,
          action: "verify",
          success: false,
          errorMessage: "Invalid session cookie signature",
          durationMs: undefined,
          metadata: { tokenLength: existingSignedToken.length },
        });
      }
    }

    // Create a new session
    const expiresAt = new Date(Date.now() + GUEST_SESSION_DURATION_MS);

    const [newSession] = await db
      .insert(guestSessions)
      .values({
        expiresAt,
      })
      .returning();

    if (!newSession) {
      return null;
    }

    // CRIT-4 FIX: Sign the session ID before storing in cookie
    const signedToken = signSessionId(newSession.id);

    // Set the signed session cookie
    cookieStore.set(GUEST_SESSION_COOKIE, signedToken, {
      httpOnly: true,
      secure: process.env["NODE_ENV"] === "production",
      sameSite: "lax",
      expires: expiresAt,
      path: "/",
    });

    await auditLog({
      event: "guest_session.created",
      level: "info" as AuditLogLevel,
      userId: undefined,
      sessionId: newSession.id,
      resource: "guest_session",
      resourceId: newSession.id,
      action: "create",
      success: true,
      errorMessage: undefined,
      durationMs: undefined,
      metadata: { expiresAt: expiresAt.toISOString() },
    });

    return {
      id: newSession.id,
      freeReadingsUsed: newSession.freeReadingsUsed,
      createdAt: newSession.createdAt,
      expiresAt: newSession.expiresAt,
    };
  }
);

/**
 * Find a valid (non-expired, non-deleted) guest session by ID.
 */
async function findValidSession(
  sessionId: string
): Promise<GuestSession | null> {
  const [session] = await db
    .select()
    .from(guestSessions)
    .where(
      and(
        eq(guestSessions.id, sessionId),
        isNull(guestSessions.deletedAt),
        gt(guestSessions.expiresAt, new Date())
      )
    )
    .limit(1);

  if (!session) {
    return null;
  }

  return {
    id: session.id,
    freeReadingsUsed: session.freeReadingsUsed,
    createdAt: session.createdAt,
    expiresAt: session.expiresAt,
  };
}

/**
 * Get the current guest session status.
 *
 * @returns Status including remaining free readings and whether user can read
 */
export async function getGuestSessionStatus(): Promise<GuestSessionStatus> {
  const session = await getOrCreateGuestSession();

  if (!session) {
    return {
      session: null,
      remainingFreeReadings: 0,
      canRead: false,
    };
  }

  const remainingFreeReadings = Math.max(
    0,
    FREE_GUEST_READINGS - session.freeReadingsUsed
  );

  return {
    session,
    remainingFreeReadings,
    canRead: remainingFreeReadings > 0,
  };
}

/**
 * Increment the free readings used count for a guest session.
 *
 * @param sessionId The guest session ID
 * @returns The updated session or null if not found/expired
 */
export async function incrementGuestReadingsUsed(
  sessionId: string
): Promise<GuestSession | null> {
  const [updated] = await db
    .update(guestSessions)
    .set({
      freeReadingsUsed: sql`${guestSessions.freeReadingsUsed} + 1`,
    })
    .where(
      and(
        eq(guestSessions.id, sessionId),
        isNull(guestSessions.deletedAt),
        gt(guestSessions.expiresAt, new Date())
      )
    )
    .returning();

  if (!updated) {
    return null;
  }

  await auditLog({
    event: "guest_session.reading_used",
    level: "info" as AuditLogLevel,
    userId: undefined,
    sessionId,
    resource: "guest_session",
    resourceId: sessionId,
    action: "reading_used",
    success: true,
    errorMessage: undefined,
    durationMs: undefined,
    metadata: { freeReadingsUsed: updated.freeReadingsUsed },
  });

  return {
    id: updated.id,
    freeReadingsUsed: updated.freeReadingsUsed,
    createdAt: updated.createdAt,
    expiresAt: updated.expiresAt,
  };
}

/**
 * Check if a guest session can perform a reading.
 *
 * @param sessionId The guest session ID
 * @returns True if the session has remaining free readings
 */
export async function canGuestRead(sessionId: string): Promise<boolean> {
  const session = await findValidSession(sessionId);

  if (!session) {
    return false;
  }

  return session.freeReadingsUsed < FREE_GUEST_READINGS;
}

/**
 * Get the guest session ID from cookies if present.
 *
 * CRIT-4 FIX: Verifies HMAC signature before returning session ID.
 *
 * @returns The verified session ID or null if not found/invalid
 */
export async function getGuestSessionId(): Promise<string | null> {
  const cookieStore = await cookies();
  const signedToken = cookieStore.get(GUEST_SESSION_COOKIE)?.value;

  if (!signedToken) {
    return null;
  }

  // Verify signature and extract session ID
  return verifyAndExtractSessionId(signedToken);
}

/**
 * Clear the guest session cookie.
 * Called when a guest user converts to a registered user.
 */
export async function clearGuestSession(): Promise<void> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(GUEST_SESSION_COOKIE)?.value;

  if (sessionId) {
    // Soft delete the session
    await db
      .update(guestSessions)
      .set({ deletedAt: new Date() })
      .where(eq(guestSessions.id, sessionId));

    await auditLog({
      event: "guest_session.cleared",
      level: "info" as AuditLogLevel,
      userId: undefined,
      sessionId,
      resource: "guest_session",
      resourceId: sessionId,
      action: "clear",
      success: true,
      errorMessage: undefined,
      durationMs: undefined,
      metadata: undefined,
    });
  }

  // Delete the cookie
  cookieStore.delete(GUEST_SESSION_COOKIE);
}
