import "server-only";
import { headers } from "next/headers";
import { createHash } from "node:crypto";

/**
 * In-memory rate limit store.
 * NOTE: For production multi-instance deployments, replace with Redis/Vercel KV.
 * The interface is designed for easy backend swapping.
 */
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

/**
 * Configuration for rate limiting behavior
 */
export interface RateLimitConfig {
  /** Time window in milliseconds */
  windowMs: number;
  /** Maximum requests allowed per window */
  maxRequests: number;
}

/**
 * Result of a rate limit check
 */
export interface RateLimitResult {
  /** Whether the request is rate limited */
  isLimited: boolean;
  /** Current count in window */
  current: number;
  /** Maximum allowed in window */
  limit: number;
  /** Milliseconds until rate limit resets */
  resetInMs: number;
  /** Headers to include in response for client awareness */
  headers: Record<string, string>;
}

/** Default config: 30 requests per minute */
const DEFAULT_CONFIG: RateLimitConfig = {
  windowMs: 60 * 1000,
  maxRequests: 30,
};

/**
 * Pre-defined rate limit configurations for different endpoints.
 * Adjust these based on abuse patterns and business needs.
 */
export const RATE_LIMITS = {
  /** Demo reading: 10 per minute (LLM calls are expensive) */
  reading: { windowMs: 60 * 1000, maxRequests: 10 },
  /** Auth attempts: 10 per 15 minutes (prevent brute force) */
  auth: { windowMs: 15 * 60 * 1000, maxRequests: 10 },
  /** Payment operations: 5 per minute (sensitive) */
  payment: { windowMs: 60 * 1000, maxRequests: 5 },
  /** General API: 60 per minute */
  api: { windowMs: 60 * 1000, maxRequests: 60 },
  /** Health checks: 120 per minute (monitoring tools) */
  health: { windowMs: 60 * 1000, maxRequests: 120 },
} as const;

/**
 * Hash an IP address for privacy-first logging.
 * Per AUDIT-GUIDELINES: Never store raw IP addresses.
 */
export function hashIp(ip: string): string {
  return createHash("sha256").update(ip).digest("hex").slice(0, 16);
}

/**
 * Get client IP from request headers.
 * Handles common proxy headers (Vercel, Cloudflare, etc.)
 */
async function getClientIp(): Promise<string> {
  const headerList = await headers();

  // Try common headers in order of preference
  const forwardedFor = headerList.get("x-forwarded-for");
  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs; first is original client
    return forwardedFor.split(",")[0]?.trim() ?? "unknown";
  }

  const realIp = headerList.get("x-real-ip");
  if (realIp) {
    return realIp;
  }

  // Vercel-specific
  const vercelIp = headerList.get("x-vercel-forwarded-for");
  if (vercelIp) {
    return vercelIp.split(",")[0]?.trim() ?? "unknown";
  }

  return "unknown";
}

/**
 * Clean up expired entries from the store.
 * Called periodically to prevent memory leaks.
 */
function cleanupExpiredEntries(): void {
  const now = Date.now();
  for (const [key, value] of rateLimitStore) {
    if (now > value.resetAt) {
      rateLimitStore.delete(key);
    }
  }
}

// Clean up every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(cleanupExpiredEntries, 5 * 60 * 1000);
}

/**
 * Check if a request should be rate limited.
 *
 * @param identifier - Optional custom identifier (defaults to hashed IP)
 * @param config - Rate limit configuration (defaults to DEFAULT_CONFIG)
 * @returns RateLimitResult with status and metadata
 *
 * @example
 * ```ts
 * const result = await checkRateLimit(undefined, RATE_LIMITS.reading);
 * if (result.isLimited) {
 *   return new Response("Too many requests", {
 *     status: 429,
 *     headers: result.headers,
 *   });
 * }
 * ```
 */
export async function checkRateLimit(
  identifier?: string,
  config: RateLimitConfig = DEFAULT_CONFIG
): Promise<RateLimitResult> {
  // Generate key from IP if no identifier provided
  const ip = await getClientIp();
  const key = identifier ?? hashIp(ip);

  const now = Date.now();
  const record = rateLimitStore.get(key);

  // No existing record or expired: create new window
  if (!record || now > record.resetAt) {
    const resetAt = now + config.windowMs;
    rateLimitStore.set(key, { count: 1, resetAt });

    return {
      isLimited: false,
      current: 1,
      limit: config.maxRequests,
      resetInMs: config.windowMs,
      headers: buildRateLimitHeaders(1, config.maxRequests, resetAt),
    };
  }

  // Increment count
  record.count++;
  const isLimited = record.count > config.maxRequests;

  return {
    isLimited,
    current: record.count,
    limit: config.maxRequests,
    resetInMs: record.resetAt - now,
    headers: buildRateLimitHeaders(record.count, config.maxRequests, record.resetAt),
  };
}

/**
 * Simple boolean check for rate limiting.
 * Use checkRateLimit() if you need metadata.
 */
export async function isRateLimited(
  identifier?: string,
  config: RateLimitConfig = DEFAULT_CONFIG
): Promise<boolean> {
  const result = await checkRateLimit(identifier, config);
  return result.isLimited;
}

/**
 * Build standard rate limit headers per RFC 6585 / draft-ietf-httpapi-ratelimit-headers
 */
function buildRateLimitHeaders(
  current: number,
  limit: number,
  resetAt: number
): Record<string, string> {
  const remaining = Math.max(0, limit - current);
  const resetSeconds = Math.ceil((resetAt - Date.now()) / 1000);

  return {
    "X-RateLimit-Limit": String(limit),
    "X-RateLimit-Remaining": String(remaining),
    "X-RateLimit-Reset": String(Math.ceil(resetAt / 1000)),
    "Retry-After": remaining === 0 ? String(resetSeconds) : "",
  };
}

/**
 * Create a rate limiter for a specific endpoint/operation.
 * Useful for creating pre-configured limiters.
 *
 * @example
 * ```ts
 * const readingLimiter = createRateLimiter(RATE_LIMITS.reading);
 *
 * // In your server action:
 * if (await readingLimiter.isLimited()) {
 *   throw new RateLimitError();
 * }
 * ```
 */
export function createRateLimiter(config: RateLimitConfig) {
  return {
    check: (identifier?: string) => checkRateLimit(identifier, config),
    isLimited: (identifier?: string) => isRateLimited(identifier, config),
  };
}
