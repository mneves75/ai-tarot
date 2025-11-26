/**
 * Custom error classes for structured error handling.
 *
 * Design principles:
 * 1. All errors extend AppError for consistent handling
 * 2. isOperational distinguishes expected errors from programming bugs
 * 3. Errors include machine-readable codes for client handling
 * 4. Context objects allow rich debugging without leaking to clients
 *
 * @module lib/errors
 */

/**
 * Base application error with structured information.
 * All custom errors should extend this class.
 */
export class AppError extends Error {
  /** Machine-readable error code for client handling */
  public readonly code: string;
  /** HTTP status code for API responses */
  public readonly statusCode: number;
  /** true = expected error (validation, auth), false = bug/unexpected */
  public readonly isOperational: boolean;
  /** Additional context for logging (never sent to client) */
  public readonly context: Record<string, unknown> | undefined;

  constructor(
    message: string,
    code: string,
    statusCode = 500,
    isOperational = true,
    context?: Record<string, unknown>
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.context = context;

    // Maintains proper stack trace for where error was thrown
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Convert to JSON for logging (includes context).
   * DO NOT use this for client responses - use toClientError() instead.
   */
  toJSON(): Record<string, unknown> {
    const result: Record<string, unknown> = {
      name: this.name,
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      isOperational: this.isOperational,
      stack: this.stack,
    };
    if (this.context !== undefined) {
      result["context"] = this.context;
    }
    return result;
  }

  /**
   * Convert to a safe format for client responses.
   * Excludes internal details like stack traces and context.
   */
  toClientError(): { code: string; message: string; statusCode: number } {
    return {
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
    };
  }
}

// ============================================================
// Authentication & Authorization Errors
// ============================================================

/**
 * User is not authenticated (needs to log in).
 * HTTP 401 Unauthorized
 */
export class AuthenticationError extends AppError {
  constructor(
    message = "Authentication required",
    context?: Record<string, unknown>
  ) {
    super(message, "AUTH_REQUIRED", 401, true, context);
  }
}

/**
 * User is authenticated but lacks permission for this action.
 * HTTP 403 Forbidden
 */
export class AuthorizationError extends AppError {
  constructor(
    message = "Permission denied",
    context?: Record<string, unknown>
  ) {
    super(message, "PERMISSION_DENIED", 403, true, context);
  }
}

// ============================================================
// Validation Errors
// ============================================================

/**
 * Input validation failed.
 * Includes optional field name for form error display.
 */
export class ValidationError extends AppError {
  public readonly field: string | undefined;

  constructor(
    message: string,
    field?: string,
    context?: Record<string, unknown>
  ) {
    const ctx: Record<string, unknown> = { ...context };
    if (field !== undefined) {
      ctx["field"] = field;
    }
    super(message, "VALIDATION_ERROR", 400, true, ctx);
    this.field = field;
  }

  override toClientError(): {
    code: string;
    message: string;
    statusCode: number;
    field?: string | undefined;
  } {
    const result = super.toClientError();
    if (this.field !== undefined) {
      return { ...result, field: this.field };
    }
    return result;
  }
}

// ============================================================
// Resource Errors
// ============================================================

/**
 * Requested resource does not exist.
 * HTTP 404 Not Found
 */
export class NotFoundError extends AppError {
  public readonly resource: string;
  public readonly resourceId: string | undefined;

  constructor(resource: string, id?: string) {
    const ctx: Record<string, unknown> = { resource };
    if (id !== undefined) {
      ctx["id"] = id;
    }
    super(
      id ? `${resource} not found: ${id}` : `${resource} not found`,
      "NOT_FOUND",
      404,
      true,
      ctx
    );
    this.resource = resource;
    this.resourceId = id;
  }
}

/**
 * Resource already exists (e.g., duplicate email).
 * HTTP 409 Conflict
 */
export class ConflictError extends AppError {
  constructor(
    message: string,
    context?: Record<string, unknown>
  ) {
    super(message, "CONFLICT", 409, true, context);
  }
}

// ============================================================
// Business Logic Errors
// ============================================================

/**
 * User doesn't have enough credits for the operation.
 * HTTP 402 Payment Required
 */
export class InsufficientCreditsError extends AppError {
  public readonly required: number;
  public readonly available: number;

  constructor(required: number, available: number) {
    super(
      `Insufficient credits: ${available} available, ${required} required`,
      "INSUFFICIENT_CREDITS",
      402,
      true,
      { required, available }
    );
    this.required = required;
    this.available = available;
  }

  override toClientError(): {
    code: string;
    message: string;
    statusCode: number;
    required: number;
    available: number;
  } {
    return {
      ...super.toClientError(),
      required: this.required,
      available: this.available,
    };
  }
}

/**
 * Rate limit exceeded.
 * HTTP 429 Too Many Requests
 */
export class RateLimitError extends AppError {
  public readonly retryAfterMs: number | undefined;

  constructor(retryAfterMs?: number) {
    const ctx: Record<string, unknown> = {};
    if (retryAfterMs !== undefined) {
      ctx["retryAfterMs"] = retryAfterMs;
    }
    super(
      "Rate limit exceeded. Please try again later.",
      "RATE_LIMIT_EXCEEDED",
      429,
      true,
      ctx
    );
    this.retryAfterMs = retryAfterMs;
  }

  override toClientError(): {
    code: string;
    message: string;
    statusCode: number;
    retryAfterMs?: number | undefined;
  } {
    const result = super.toClientError();
    if (this.retryAfterMs !== undefined) {
      return { ...result, retryAfterMs: this.retryAfterMs };
    }
    return result;
  }
}

/**
 * Free reading quota exhausted for guest.
 */
export class QuotaExhaustedError extends AppError {
  constructor(context?: Record<string, unknown>) {
    super(
      "Free reading quota exhausted. Please sign up or purchase credits.",
      "QUOTA_EXHAUSTED",
      402,
      true,
      context
    );
  }
}

// ============================================================
// External Service Errors
// ============================================================

/**
 * LLM provider error (Gemini, OpenAI, etc.)
 * HTTP 502 Bad Gateway
 */
export class LLMError extends AppError {
  public readonly provider: string;

  constructor(
    message: string,
    provider: string,
    context?: Record<string, unknown>
  ) {
    super(
      `LLM error (${provider}): ${message}`,
      "LLM_ERROR",
      502,
      true,
      { ...context, provider }
    );
    this.provider = provider;
  }
}

/**
 * Payment provider error (Stripe, etc.)
 * HTTP 502 Bad Gateway
 */
export class PaymentError extends AppError {
  public readonly provider: string;

  constructor(
    message: string,
    provider: string,
    context?: Record<string, unknown>
  ) {
    super(
      `Payment error (${provider}): ${message}`,
      "PAYMENT_ERROR",
      502,
      true,
      { ...context, provider }
    );
    this.provider = provider;
  }
}

// ============================================================
// Infrastructure Errors
// ============================================================

/**
 * Database operation failed.
 * Usually NOT operational (indicates a bug or infrastructure issue).
 */
export class DatabaseError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, "DATABASE_ERROR", 500, false, context);
  }
}

/**
 * Configuration or environment error.
 * NOT operational - indicates missing setup.
 */
export class ConfigurationError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, "CONFIGURATION_ERROR", 500, false, context);
  }
}

// ============================================================
// Error Utilities
// ============================================================

/**
 * Type guard to check if an error is an AppError.
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/**
 * Convert any error to an AppError.
 * Use this to ensure consistent error handling.
 */
export function toAppError(error: unknown): AppError {
  if (isAppError(error)) {
    return error;
  }

  if (error instanceof Error) {
    return new AppError(
      error.message,
      "INTERNAL_ERROR",
      500,
      false,
      { originalName: error.name, stack: error.stack }
    );
  }

  return new AppError(
    "An unexpected error occurred",
    "INTERNAL_ERROR",
    500,
    false,
    { originalError: String(error) }
  );
}

/**
 * Create a safe error response for the client.
 * Hides internal details for non-operational errors.
 */
export function toClientSafeError(error: unknown): {
  code: string;
  message: string;
  statusCode: number;
} {
  const appError = toAppError(error);

  // For non-operational errors, hide the actual message
  if (!appError.isOperational) {
    return {
      code: "INTERNAL_ERROR",
      message: "An unexpected error occurred. Please try again later.",
      statusCode: 500,
    };
  }

  return appError.toClientError();
}
