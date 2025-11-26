import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  checkRateLimit,
  isRateLimited,
  RATE_LIMITS,
  hashIp,
} from "@/lib/utils/rate-limit";

describe("rate-limit", () => {
  beforeEach(() => {
    // Reset the in-memory store between tests by resetting modules
    vi.resetModules();
  });

  describe("checkRateLimit", () => {
    it("should allow requests within the limit", async () => {
      const config = { windowMs: 60000, maxRequests: 5 };
      const identifier = "test-user-allow-1";

      // First request should be allowed
      const result = await checkRateLimit(identifier, config);

      expect(result.isLimited).toBe(false);
      expect(result.current).toBe(1);
      expect(result.limit).toBe(5);
      expect(result.resetInMs).toBeGreaterThan(0);
      expect(result.resetInMs).toBeLessThanOrEqual(60000);
    });

    it("should track requests and increment current", async () => {
      const config = { windowMs: 60000, maxRequests: 5 };
      const identifier = "test-user-track-1";

      const result1 = await checkRateLimit(identifier, config);
      expect(result1.current).toBe(1);

      const result2 = await checkRateLimit(identifier, config);
      expect(result2.current).toBe(2);

      const result3 = await checkRateLimit(identifier, config);
      expect(result3.current).toBe(3);
      expect(result3.isLimited).toBe(false);
    });

    it("should limit requests when quota is exceeded", async () => {
      const config = { windowMs: 60000, maxRequests: 2 };
      const identifier = "test-user-limit-1";

      // Use up the quota (2 allowed)
      await checkRateLimit(identifier, config);
      await checkRateLimit(identifier, config);

      // This should be limited (3rd request)
      const result = await checkRateLimit(identifier, config);
      expect(result.isLimited).toBe(true);
      expect(result.current).toBe(3);
    });

    it("should isolate rate limits between different identifiers", async () => {
      const config = { windowMs: 60000, maxRequests: 2 };

      // User A uses their quota
      await checkRateLimit("user-isolate-a", config);
      await checkRateLimit("user-isolate-a", config);

      // User B should still have full quota
      const resultB = await checkRateLimit("user-isolate-b", config);
      expect(resultB.isLimited).toBe(false);
      expect(resultB.current).toBe(1);
    });

    it("should use IP-based identifier when none provided", async () => {
      const config = { windowMs: 60000, maxRequests: 5 };

      // Should not throw when identifier is undefined
      const result = await checkRateLimit(undefined, config);
      expect(result.isLimited).toBe(false);
    });

    it("should use default config when none provided", async () => {
      const result = await checkRateLimit("test-default-config");

      // Default config is 30 requests per minute
      expect(result.limit).toBe(30);
    });

    it("should include rate limit headers", async () => {
      const config = { windowMs: 60000, maxRequests: 10 };
      const identifier = "test-headers-1";

      const result = await checkRateLimit(identifier, config);

      expect(result.headers).toBeDefined();
      expect(result.headers["X-RateLimit-Limit"]).toBe("10");
      expect(result.headers["X-RateLimit-Remaining"]).toBeDefined();
      expect(result.headers["X-RateLimit-Reset"]).toBeDefined();
    });
  });

  describe("isRateLimited", () => {
    it("should return false for allowed requests", async () => {
      const limited = await isRateLimited("test-simple-1", RATE_LIMITS.api);
      expect(limited).toBe(false);
    });

    it("should return true when limit exceeded", async () => {
      const config = { windowMs: 60000, maxRequests: 1 };
      const identifier = "test-exceed-1";

      // Use the quota
      await isRateLimited(identifier, config);

      // Should now be limited
      const limited = await isRateLimited(identifier, config);
      expect(limited).toBe(true);
    });
  });

  describe("hashIp", () => {
    it("should hash IP addresses", () => {
      const hash = hashIp("192.168.1.1");

      expect(hash).toBeDefined();
      expect(hash.length).toBe(16); // First 16 chars of sha256
    });

    it("should produce consistent hashes", () => {
      const hash1 = hashIp("192.168.1.1");
      const hash2 = hashIp("192.168.1.1");

      expect(hash1).toBe(hash2);
    });

    it("should produce different hashes for different IPs", () => {
      const hash1 = hashIp("192.168.1.1");
      const hash2 = hashIp("192.168.1.2");

      expect(hash1).not.toBe(hash2);
    });
  });

  describe("RATE_LIMITS", () => {
    it("should have reading configuration", () => {
      expect(RATE_LIMITS.reading).toBeDefined();
      expect(RATE_LIMITS.reading.windowMs).toBe(60 * 1000);
      expect(RATE_LIMITS.reading.maxRequests).toBe(10);
    });

    it("should have auth configuration", () => {
      expect(RATE_LIMITS.auth).toBeDefined();
      expect(RATE_LIMITS.auth.windowMs).toBe(15 * 60 * 1000);
      expect(RATE_LIMITS.auth.maxRequests).toBe(10);
    });

    it("should have payment configuration", () => {
      expect(RATE_LIMITS.payment).toBeDefined();
      expect(RATE_LIMITS.payment.windowMs).toBe(60 * 1000);
      expect(RATE_LIMITS.payment.maxRequests).toBe(5);
    });

    it("should have api configuration", () => {
      expect(RATE_LIMITS.api).toBeDefined();
      expect(RATE_LIMITS.api.windowMs).toBe(60 * 1000);
      expect(RATE_LIMITS.api.maxRequests).toBe(60);
    });

    it("should have health configuration", () => {
      expect(RATE_LIMITS.health).toBeDefined();
      expect(RATE_LIMITS.health.windowMs).toBe(60 * 1000);
      expect(RATE_LIMITS.health.maxRequests).toBe(120);
    });
  });
});
