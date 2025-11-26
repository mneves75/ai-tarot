import { describe, it, expect } from "vitest";
import { isValidUuid, isValidUuidV4, assertValidUuid } from "@/lib/validation";

describe("UUID Validation", () => {
  describe("isValidUuid", () => {
    it("should accept valid UUID v4", () => {
      expect(isValidUuid("550e8400-e29b-41d4-a716-446655440000")).toBe(true);
      expect(isValidUuid("6ba7b810-9dad-11d1-80b4-00c04fd430c8")).toBe(true);
    });

    it("should accept UUID v1", () => {
      // UUID v1 (time-based)
      expect(isValidUuid("6ba7b810-9dad-11d1-80b4-00c04fd430c8")).toBe(true);
    });

    it("should accept lowercase UUIDs", () => {
      expect(isValidUuid("550e8400-e29b-41d4-a716-446655440000")).toBe(true);
    });

    it("should accept uppercase UUIDs", () => {
      expect(isValidUuid("550E8400-E29B-41D4-A716-446655440000")).toBe(true);
    });

    it("should accept mixed case UUIDs", () => {
      expect(isValidUuid("550e8400-E29B-41d4-A716-446655440000")).toBe(true);
    });

    it("should reject empty string", () => {
      expect(isValidUuid("")).toBe(false);
    });

    it("should reject random strings", () => {
      expect(isValidUuid("not-a-uuid")).toBe(false);
      expect(isValidUuid("hello world")).toBe(false);
      expect(isValidUuid("12345")).toBe(false);
    });

    it("should reject UUID without dashes", () => {
      expect(isValidUuid("550e8400e29b41d4a716446655440000")).toBe(false);
    });

    it("should reject UUID with wrong dash positions", () => {
      expect(isValidUuid("550e-8400-e29b-41d4-a716446655440000")).toBe(false);
    });

    it("should reject UUID with invalid characters", () => {
      expect(isValidUuid("550e8400-e29b-41d4-a716-44665544000g")).toBe(false);
      expect(isValidUuid("550e8400-e29b-41d4-a716-44665544000!")).toBe(false);
    });

    it("should reject UUID with wrong length", () => {
      expect(isValidUuid("550e8400-e29b-41d4-a716-4466554400")).toBe(false);
      expect(isValidUuid("550e8400-e29b-41d4-a716-44665544000000")).toBe(false);
    });

    it("should reject null-ish values cast to string", () => {
      expect(isValidUuid("null")).toBe(false);
      expect(isValidUuid("undefined")).toBe(false);
    });
  });

  describe("isValidUuidV4", () => {
    it("should accept valid UUID v4", () => {
      // UUID v4: xxxxxxxx-xxxx-4xxx-[89ab]xxx-xxxxxxxxxxxx
      expect(isValidUuidV4("550e8400-e29b-41d4-a716-446655440000")).toBe(true);
      expect(isValidUuidV4("f47ac10b-58cc-4372-a567-0e02b2c3d479")).toBe(true);
    });

    it("should accept UUID v4 with variant bits 8, 9, a, b", () => {
      expect(isValidUuidV4("550e8400-e29b-4000-8000-446655440000")).toBe(true);
      expect(isValidUuidV4("550e8400-e29b-4000-9000-446655440000")).toBe(true);
      expect(isValidUuidV4("550e8400-e29b-4000-a000-446655440000")).toBe(true);
      expect(isValidUuidV4("550e8400-e29b-4000-b000-446655440000")).toBe(true);
    });

    it("should reject UUID v1 (version not 4)", () => {
      // UUID v1 has version 1, not 4
      expect(isValidUuidV4("6ba7b810-9dad-11d1-80b4-00c04fd430c8")).toBe(false);
    });

    it("should reject UUID with wrong variant (0-7, c-f)", () => {
      // Variant must be 8, 9, a, or b
      expect(isValidUuidV4("550e8400-e29b-4000-0000-446655440000")).toBe(false);
      expect(isValidUuidV4("550e8400-e29b-4000-7000-446655440000")).toBe(false);
      expect(isValidUuidV4("550e8400-e29b-4000-c000-446655440000")).toBe(false);
      expect(isValidUuidV4("550e8400-e29b-4000-f000-446655440000")).toBe(false);
    });

    it("should reject completely invalid strings", () => {
      expect(isValidUuidV4("not-a-uuid")).toBe(false);
      expect(isValidUuidV4("")).toBe(false);
    });
  });

  describe("assertValidUuid", () => {
    it("should not throw for valid UUID", () => {
      expect(() => {
        assertValidUuid("550e8400-e29b-41d4-a716-446655440000");
      }).not.toThrow();
    });

    it("should throw for invalid UUID", () => {
      expect(() => {
        assertValidUuid("not-a-uuid");
      }).toThrow("Invalid UUID format for id");
    });

    it("should include parameter name in error message", () => {
      expect(() => {
        assertValidUuid("not-a-uuid", "userId");
      }).toThrow("Invalid UUID format for userId");

      expect(() => {
        assertValidUuid("not-a-uuid", "readingId");
      }).toThrow("Invalid UUID format for readingId");
    });

    it("should throw for empty string", () => {
      expect(() => {
        assertValidUuid("");
      }).toThrow();
    });
  });
});
