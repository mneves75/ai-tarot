import { z } from "zod";

/**
 * Zod schemas for LLM structured output.
 *
 * These schemas define the expected format of AI responses,
 * ensuring type safety and validation.
 *
 * @module lib/llm/schemas
 */

/**
 * Schema for individual card interpretation
 */
export const CardInterpretationSchema = z.object({
  position: z.string().describe("The position role (e.g., 'passado', 'presente', 'futuro')"),
  interpretation: z
    .string()
    .min(50)
    .max(500)
    .describe("The symbolic interpretation of this card in this position"),
  advice: z
    .string()
    .max(200)
    .optional()
    .describe("Optional practical advice related to this card"),
});

/**
 * Schema for the complete reading output
 */
export const ReadingOutputSchema = z.object({
  summary: z
    .string()
    .min(20)
    .max(200)
    .describe("1-2 sentence synthesis of the entire reading"),
  perCard: z
    .array(CardInterpretationSchema)
    .describe("Interpretation for each card in the spread"),
  overallMessage: z
    .string()
    .min(50)
    .max(500)
    .describe("The overall message and guidance from the reading"),
  safetyReminder: z
    .string()
    .describe("Reminder that this is symbolic entertainment, not prediction or advice"),
});

export type ReadingOutput = z.infer<typeof ReadingOutputSchema>;
export type CardInterpretation = z.infer<typeof CardInterpretationSchema>;
