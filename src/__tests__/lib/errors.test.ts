import { describe, it, expect } from "vitest";
import {
  AppError,
  AuthenticationError,
  AuthorizationError,
  ValidationError,
  NotFoundError,
  ConflictError,
  InsufficientCreditsError,
  RateLimitError,
  QuotaExhaustedError,
  LLMError,
  PaymentError,
  DatabaseError,
  ConfigurationError,
  toAppError,
  toClientSafeError,
  isAppError,
} from "@/lib/errors";

describe("errors", () => {
  describe("AppError", () => {
    it("should create an operational error with provided values", () => {
      const error = new AppError("Test error", "TEST_CODE", 400, true);

      expect(error.message).toBe("Test error");
      expect(error.code).toBe("TEST_CODE");
      expect(error.statusCode).toBe(400);
      expect(error.isOperational).toBe(true);
      expect(error.context).toBeUndefined();
      expect(error.name).toBe("AppError");
    });

    it("should create error with default statusCode", () => {
      const error = new AppError("Error", "CODE");

      expect(error.statusCode).toBe(500);
    });

    it("should support context", () => {
      const context = { userId: "123", action: "test" };
      const error = new AppError("Error with context", "TEST", 400, true, context);

      expect(error.context).toEqual(context);
    });

    it("should mark as non-operational when specified", () => {
      const error = new AppError("Non-operational error", "FATAL", 500, false);

      expect(error.isOperational).toBe(false);
    });

    it("should convert to JSON", () => {
      const error = new AppError("Test", "CODE", 400, true, { foo: "bar" });
      const json = error.toJSON();

      expect(json["name"]).toBe("AppError");
      expect(json["code"]).toBe("CODE");
      expect(json["message"]).toBe("Test");
      expect(json["context"]).toEqual({ foo: "bar" });
    });

    it("should convert to client error", () => {
      const error = new AppError("Test", "CODE", 400, true, { secret: "hidden" });
      const clientError = error.toClientError();

      expect(clientError.code).toBe("CODE");
      expect(clientError.message).toBe("Test");
      expect(clientError.statusCode).toBe(400);
      expect(clientError).not.toHaveProperty("context");
    });
  });

  describe("AuthenticationError", () => {
    it("should create authentication error with defaults", () => {
      const error = new AuthenticationError();

      expect(error.message).toBe("Authentication required");
      expect(error.code).toBe("AUTH_REQUIRED");
      expect(error.statusCode).toBe(401);
      expect(error.isOperational).toBe(true);
    });

    it("should support custom message", () => {
      const error = new AuthenticationError("Token expired");

      expect(error.message).toBe("Token expired");
    });
  });

  describe("AuthorizationError", () => {
    it("should create authorization error with defaults", () => {
      const error = new AuthorizationError();

      expect(error.message).toBe("Permission denied");
      expect(error.code).toBe("PERMISSION_DENIED");
      expect(error.statusCode).toBe(403);
    });
  });

  describe("ValidationError", () => {
    it("should create validation error with field", () => {
      const error = new ValidationError("Email is invalid", "email");

      expect(error.message).toBe("Email is invalid");
      expect(error.code).toBe("VALIDATION_ERROR");
      expect(error.statusCode).toBe(400);
      expect(error.field).toBe("email");
    });

    it("should work without field", () => {
      const error = new ValidationError("Invalid input");

      expect(error.field).toBeUndefined();
    });

    it("should include field in client error", () => {
      const error = new ValidationError("Invalid", "email");
      const clientError = error.toClientError();

      expect(clientError.field).toBe("email");
    });
  });

  describe("NotFoundError", () => {
    it("should create not found error for resource", () => {
      const error = new NotFoundError("User");

      expect(error.message).toBe("User not found");
      expect(error.code).toBe("NOT_FOUND");
      expect(error.statusCode).toBe(404);
      expect(error.resource).toBe("User");
    });

    it("should include resource id when provided", () => {
      const error = new NotFoundError("User", "123");

      expect(error.message).toBe("User not found: 123");
      expect(error.resourceId).toBe("123");
    });
  });

  describe("ConflictError", () => {
    it("should create conflict error", () => {
      const error = new ConflictError("Email already exists");

      expect(error.message).toBe("Email already exists");
      expect(error.code).toBe("CONFLICT");
      expect(error.statusCode).toBe(409);
    });
  });

  describe("InsufficientCreditsError", () => {
    it("should create credits error with amounts", () => {
      const error = new InsufficientCreditsError(5, 3);

      expect(error.message).toBe("Insufficient credits: 3 available, 5 required");
      expect(error.code).toBe("INSUFFICIENT_CREDITS");
      expect(error.statusCode).toBe(402);
      expect(error.required).toBe(5);
      expect(error.available).toBe(3);
    });

    it("should include amounts in client error", () => {
      const error = new InsufficientCreditsError(10, 2);
      const clientError = error.toClientError();

      expect(clientError.required).toBe(10);
      expect(clientError.available).toBe(2);
    });
  });

  describe("RateLimitError", () => {
    it("should create rate limit error", () => {
      const error = new RateLimitError();

      expect(error.message).toBe("Rate limit exceeded. Please try again later.");
      expect(error.code).toBe("RATE_LIMIT_EXCEEDED");
      expect(error.statusCode).toBe(429);
    });

    it("should include retry time when provided", () => {
      const error = new RateLimitError(30000);

      expect(error.retryAfterMs).toBe(30000);
    });

    it("should include retryAfterMs in client error", () => {
      const error = new RateLimitError(60000);
      const clientError = error.toClientError();

      expect(clientError.retryAfterMs).toBe(60000);
    });
  });

  describe("QuotaExhaustedError", () => {
    it("should create quota exhausted error", () => {
      const error = new QuotaExhaustedError();

      expect(error.message).toBe(
        "Free reading quota exhausted. Please sign up or purchase credits."
      );
      expect(error.code).toBe("QUOTA_EXHAUSTED");
      expect(error.statusCode).toBe(402);
    });
  });

  describe("LLMError", () => {
    it("should create LLM error with provider", () => {
      const error = new LLMError("API call failed", "openai");

      expect(error.message).toBe("LLM error (openai): API call failed");
      expect(error.code).toBe("LLM_ERROR");
      expect(error.statusCode).toBe(502);
      expect(error.provider).toBe("openai");
    });

    it("should support context", () => {
      const error = new LLMError("Timeout", "gemini", { timeout: 30000 });

      expect(error.context).toEqual({ timeout: 30000, provider: "gemini" });
    });
  });

  describe("PaymentError", () => {
    it("should create payment error", () => {
      const error = new PaymentError("Card declined", "stripe");

      expect(error.message).toBe("Payment error (stripe): Card declined");
      expect(error.code).toBe("PAYMENT_ERROR");
      expect(error.statusCode).toBe(502);
      expect(error.provider).toBe("stripe");
    });
  });

  describe("DatabaseError", () => {
    it("should create database error", () => {
      const error = new DatabaseError("Connection timeout");

      expect(error.message).toBe("Connection timeout");
      expect(error.code).toBe("DATABASE_ERROR");
      expect(error.statusCode).toBe(500);
      expect(error.isOperational).toBe(false);
    });
  });

  describe("ConfigurationError", () => {
    it("should create configuration error", () => {
      const error = new ConfigurationError("API_KEY not set");

      expect(error.message).toBe("API_KEY not set");
      expect(error.code).toBe("CONFIGURATION_ERROR");
      expect(error.statusCode).toBe(500);
      expect(error.isOperational).toBe(false);
    });
  });

  describe("isAppError", () => {
    it("should return true for AppError instances", () => {
      expect(isAppError(new AppError("test", "CODE"))).toBe(true);
      expect(isAppError(new ValidationError("test"))).toBe(true);
    });

    it("should return false for non-AppError", () => {
      expect(isAppError(new Error("test"))).toBe(false);
      expect(isAppError("string")).toBe(false);
      expect(isAppError(null)).toBe(false);
    });
  });

  describe("toAppError", () => {
    it("should pass through AppError instances", () => {
      const original = new ValidationError("Test", "field");
      const converted = toAppError(original);

      expect(converted).toBe(original);
    });

    it("should convert standard Error to AppError", () => {
      const original = new Error("Standard error");
      const converted = toAppError(original);

      expect(converted).toBeInstanceOf(AppError);
      expect(converted.message).toBe("Standard error");
      expect(converted.code).toBe("INTERNAL_ERROR");
      expect(converted.isOperational).toBe(false);
    });

    it("should handle non-Error objects", () => {
      const converted = toAppError("string error");

      expect(converted).toBeInstanceOf(AppError);
      expect(converted.message).toBe("An unexpected error occurred");
      expect(converted.isOperational).toBe(false);
    });

    it("should handle null/undefined", () => {
      const converted = toAppError(null);

      expect(converted).toBeInstanceOf(AppError);
      expect(converted.message).toBe("An unexpected error occurred");
    });
  });

  describe("toClientSafeError", () => {
    it("should expose operational error messages", () => {
      const original = new ValidationError("Email is invalid", "email");
      const safe = toClientSafeError(original);

      expect(safe.code).toBe("VALIDATION_ERROR");
      expect(safe.message).toBe("Email is invalid");
    });

    it("should hide non-operational error messages", () => {
      const original = new DatabaseError("PostgreSQL connection failed");
      const safe = toClientSafeError(original);

      expect(safe.code).toBe("INTERNAL_ERROR");
      expect(safe.message).toBe("An unexpected error occurred. Please try again later.");
    });

    it("should hide standard Error messages", () => {
      const original = new Error("Sensitive database info");
      const safe = toClientSafeError(original);

      expect(safe.code).toBe("INTERNAL_ERROR");
      expect(safe.message).toBe("An unexpected error occurred. Please try again later.");
    });

    it("should hide non-error objects", () => {
      const safe = toClientSafeError("sensitive string");

      expect(safe.code).toBe("INTERNAL_ERROR");
      expect(safe.message).toBe("An unexpected error occurred. Please try again later.");
    });
  });
});
