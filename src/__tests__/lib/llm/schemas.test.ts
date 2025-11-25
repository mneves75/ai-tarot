import { describe, it, expect } from "vitest";
import { ReadingOutputSchema, CardInterpretationSchema } from "@/lib/llm/schemas";

describe("LLM Schemas", () => {
  describe("CardInterpretationSchema", () => {
    it("should validate a valid card interpretation", () => {
      const valid = {
        position: "presente",
        interpretation: "A".repeat(50), // Minimum 50 characters
        advice: "Some advice",
      };

      const result = CardInterpretationSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("should allow interpretation without advice", () => {
      const valid = {
        position: "passado",
        interpretation: "B".repeat(100),
      };

      const result = CardInterpretationSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("should reject interpretation shorter than 50 characters", () => {
      const invalid = {
        position: "futuro",
        interpretation: "Too short",
      };

      const result = CardInterpretationSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it("should reject interpretation longer than 500 characters", () => {
      const invalid = {
        position: "presente",
        interpretation: "A".repeat(501),
      };

      const result = CardInterpretationSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it("should reject advice longer than 200 characters", () => {
      const invalid = {
        position: "presente",
        interpretation: "A".repeat(100),
        advice: "B".repeat(201),
      };

      const result = CardInterpretationSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe("ReadingOutputSchema", () => {
    const createValidOutput = () => ({
      summary: "This is a summary of the reading.",
      perCard: [
        {
          position: "presente",
          interpretation: "A".repeat(60),
          advice: "Consider this advice",
        },
      ],
      overallMessage: "C".repeat(100),
      safetyReminder: "Remember this is for entertainment only.",
    });

    it("should validate a valid reading output", () => {
      const valid = createValidOutput();
      const result = ReadingOutputSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("should reject summary shorter than 20 characters", () => {
      const invalid = {
        ...createValidOutput(),
        summary: "Too short",
      };

      const result = ReadingOutputSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it("should reject summary longer than 200 characters", () => {
      const invalid = {
        ...createValidOutput(),
        summary: "A".repeat(201),
      };

      const result = ReadingOutputSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it("should reject overall message shorter than 50 characters", () => {
      const invalid = {
        ...createValidOutput(),
        overallMessage: "Too short message",
      };

      const result = ReadingOutputSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it("should reject overall message longer than 500 characters", () => {
      const invalid = {
        ...createValidOutput(),
        overallMessage: "A".repeat(501),
      };

      const result = ReadingOutputSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it("should accept empty perCard array", () => {
      const valid = {
        ...createValidOutput(),
        perCard: [],
      };

      const result = ReadingOutputSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("should accept multiple cards in perCard", () => {
      const valid = {
        ...createValidOutput(),
        perCard: [
          { position: "passado", interpretation: "A".repeat(60) },
          { position: "presente", interpretation: "B".repeat(60) },
          { position: "futuro", interpretation: "C".repeat(60) },
        ],
      };

      const result = ReadingOutputSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("should require safetyReminder", () => {
      const invalid = {
        summary: "Summary of the reading goes here.",
        perCard: [],
        overallMessage: "D".repeat(60),
        // Missing safetyReminder
      };

      const result = ReadingOutputSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });
});
