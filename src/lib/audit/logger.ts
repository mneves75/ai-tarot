import "server-only";
import { headers } from "next/headers";
import { createHash } from "node:crypto";
import { db } from "@/lib/db";
import { auditLogs } from "@/lib/db/schema";

/**
 * Audit logging following AUDIT-GUIDELINES.md
 *
 * Key principles:
 * 1. 5W+H: Who, What, When, Where, Why, How
 * 2. Privacy-first: Hash PII (IPs), never store raw sensitive data
 * 3. Append-only: Audit logs are NEVER deleted or modified
 * 4. Never fail silently: Log to console if DB write fails
 *
 * @module lib/audit
 */

/**
 * Log levels following standard severity hierarchy
 */
export type AuditLogLevel = "info" | "warn" | "error";

/**
 * Input for creating an audit log entry
 */
export interface AuditLogInput {
  /** Event identifier (e.g., 'reading.created', 'auth.login') */
  event: string;
  /** Severity level */
  level: AuditLogLevel | undefined;
  /** User who performed the action (from auth) */
  userId: string | undefined;
  /** Session identifier for tracking across requests */
  sessionId: string | undefined;
  /** Type of resource affected (e.g., 'readings', 'profiles') */
  resource: string | undefined;
  /** Specific resource ID affected */
  resourceId: string | undefined;
  /** Action performed (e.g., 'create', 'update', 'delete') */
  action: string | undefined;
  /** Whether the operation succeeded */
  success: boolean;
  /** Error message if operation failed */
  errorMessage: string | undefined;
  /** Operation duration in milliseconds */
  durationMs: number | undefined;
  /** Additional structured metadata */
  metadata: Record<string, unknown> | undefined;
}

/**
 * Hash a string for privacy-preserving storage.
 * Used for IP addresses and other PII.
 */
function hashForPrivacy(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

/**
 * Get request context from headers.
 * Extracts IP, user agent, and request ID.
 */
async function getRequestContext(): Promise<{
  requestId: string;
  ipAddressHash: string;
  userAgent: string | undefined;
}> {
  try {
    const headerList = await headers();

    // Get request ID (Vercel adds this, or we generate one)
    const requestId =
      headerList.get("x-vercel-id") ??
      headerList.get("x-request-id") ??
      crypto.randomUUID();

    // Get client IP from various headers
    const ip =
      headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      headerList.get("x-real-ip") ??
      headerList.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() ??
      "unknown";

    // Hash IP for privacy
    const ipAddressHash = hashForPrivacy(ip);

    // Get user agent (truncate for storage)
    const userAgent = headerList.get("user-agent")?.slice(0, 256);

    return { requestId, ipAddressHash, userAgent };
  } catch {
    // Headers not available (e.g., during build or non-request context)
    return {
      requestId: crypto.randomUUID(),
      ipAddressHash: hashForPrivacy("unknown"),
      userAgent: undefined,
    };
  }
}

/**
 * Log an audit event to the database.
 *
 * CRITICAL: This function NEVER throws. If DB write fails, it logs to console.
 * Audit logging should never break the main application flow.
 *
 * @example
 * ```ts
 * await auditLog({
 *   event: "reading.created",
 *   level: "info",
 *   userId: user.id,
 *   resource: "readings",
 *   resourceId: reading.id,
 *   action: "create",
 *   success: true,
 *   durationMs: 1234,
 *   metadata: { spreadType: "three", model: "gemini-2.0-flash" },
 * });
 * ```
 */
export async function auditLog(input: AuditLogInput): Promise<void> {
  try {
    const { requestId, ipAddressHash, userAgent } = await getRequestContext();

    await db.insert(auditLogs).values({
      event: input.event,
      level: input.level ?? "info",
      userId: input.userId,
      sessionId: input.sessionId,
      requestId,
      ipAddressHash,
      userAgent,
      resource: input.resource,
      resourceId: input.resourceId,
      action: input.action,
      success: input.success,
      errorMessage: input.errorMessage?.slice(0, 500), // Truncate for storage
      durationMs: input.durationMs,
      metadata: sanitizeMetadata(input.metadata),
    });
  } catch (error) {
    // NEVER fail silently - log to console as fallback
    console.error("AUDIT_LOG_FAILURE", {
      input: {
        ...input,
        // Don't log full metadata in error case to avoid sensitive data leakage
        metadata: input.metadata ? "[REDACTED]" : undefined,
      },
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Sanitize metadata to remove potentially sensitive information
 * and ensure it's JSON-serializable.
 */
function sanitizeMetadata(
  metadata: Record<string, unknown> | undefined
): Record<string, unknown> | null {
  if (!metadata) return null;

  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(metadata)) {
    // Skip sensitive-looking keys
    const lowerKey = key.toLowerCase();
    if (
      lowerKey.includes("password") ||
      lowerKey.includes("secret") ||
      lowerKey.includes("token") ||
      lowerKey.includes("key") ||
      lowerKey.includes("credential")
    ) {
      sanitized[key] = "[REDACTED]";
      continue;
    }

    // Ensure value is JSON-serializable
    try {
      JSON.stringify(value);
      sanitized[key] = value;
    } catch {
      sanitized[key] = "[NON_SERIALIZABLE]";
    }
  }

  return sanitized;
}

/**
 * Create a structured log entry for console output.
 * Use for application logs (not audit trail).
 */
export function structuredLog(
  level: AuditLogLevel,
  message: string,
  context?: Record<string, unknown>
): void {
  const log = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...context,
  };

  const output = JSON.stringify(log);

  switch (level) {
    case "error":
      console.error(output);
      break;
    case "warn":
      console.warn(output);
      break;
    default:
      console.log(output);
  }
}

/**
 * Predefined event names for consistency.
 * Use these constants instead of string literals.
 */
export const AuditEvents = {
  // Auth events
  AUTH_LOGIN: "auth.login",
  AUTH_LOGOUT: "auth.logout",
  AUTH_REGISTER: "auth.register",
  AUTH_PASSWORD_RESET: "auth.password_reset",

  // Reading events
  READING_CREATED: "reading.created",
  READING_VIEWED: "reading.viewed",
  READING_DELETED: "reading.deleted",

  // Credit events
  CREDITS_PURCHASED: "credits.purchased",
  CREDITS_SPENT: "credits.spent",
  CREDITS_ADJUSTED: "credits.adjusted",

  // Payment events
  PAYMENT_INITIATED: "payment.initiated",
  PAYMENT_COMPLETED: "payment.completed",
  PAYMENT_FAILED: "payment.failed",
  PAYMENT_REFUNDED: "payment.refunded",

  // Journal events
  JOURNAL_CREATED: "journal.created",
  JOURNAL_UPDATED: "journal.updated",
  JOURNAL_DELETED: "journal.deleted",

  // Admin events
  ADMIN_USER_VIEWED: "admin.user_viewed",
  ADMIN_DATA_EXPORTED: "admin.data_exported",
} as const;

export type AuditEvent = (typeof AuditEvents)[keyof typeof AuditEvents];

/**
 * Helper to create a timer for measuring operation duration.
 *
 * @example
 * ```ts
 * const timer = createAuditTimer();
 * // ... do work ...
 * await auditLog({ event: "reading.created", success: true, durationMs: timer() });
 * ```
 */
export function createAuditTimer(): () => number {
  const start = Date.now();
  return () => Date.now() - start;
}
