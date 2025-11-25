import "server-only";
import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { openai } from "@ai-sdk/openai";
import { LLMError, ConfigurationError } from "@/lib/errors";
import { structuredLog } from "@/lib/audit/logger";
import { ReadingOutputSchema, type ReadingOutput } from "./schemas";
import { SYSTEM_PROMPT, buildUserPrompt } from "./prompts";

/**
 * LLM Service - Abstraction layer for AI provider interactions.
 *
 * Features:
 * - Provider fallback (Gemini primary, OpenAI secondary)
 * - Structured output with Zod validation
 * - Cost tracking and budget enforcement
 * - Comprehensive logging
 *
 * @module lib/llm/service
 */

// ============================================================
// TYPES
// ============================================================

export interface GenerateReadingInput {
  question: string;
  cards: Array<{
    name: string;
    positionRole: string;
    orientation: "upright" | "reversed";
    keywords: string[];
    description: string;
  }>;
  language: "pt-BR" | "en-US";
}

export interface GenerateReadingResult {
  output: ReadingOutput;
  model: string;
  tokensPrompt: number;
  tokensCompletion: number;
  latencyMs: number;
}

// ============================================================
// CONFIGURATION
// ============================================================

// Cost per 1M tokens (approximate, as of 2025)
// Reference: https://ai.google.dev/pricing
const COST_PER_MILLION_TOKENS: Record<string, { input: number; output: number }> = {
  "gemini-2.0-flash": { input: 0.10, output: 0.40 },
  "gpt-4o-mini": { input: 0.15, output: 0.60 },
};

// Daily budget limit in USD
const DAILY_BUDGET_USD = parseFloat(process.env["LLM_DAILY_BUDGET_USD"] ?? "50");

// In-memory tracking (for single-instance deployments)
// TODO: For multi-instance, move to Redis/KV store
let dailySpend = 0;
let lastResetDate = new Date().toDateString();

// ============================================================
// BUDGET MANAGEMENT
// ============================================================

function checkAndResetDailyBudget(): void {
  const today = new Date().toDateString();
  if (today !== lastResetDate) {
    dailySpend = 0;
    lastResetDate = today;
    structuredLog("info", "Daily LLM budget reset", { date: today });
  }
}

function checkBudget(): void {
  checkAndResetDailyBudget();

  if (dailySpend >= DAILY_BUDGET_USD) {
    structuredLog("warn", "Daily LLM budget exceeded", {
      dailySpend,
      budget: DAILY_BUDGET_USD,
    });
    throw new LLMError(
      "Daily AI budget exceeded. Please try again tomorrow.",
      "budget"
    );
  }
}

function trackCost(
  model: string,
  promptTokens: number,
  completionTokens: number
): number {
  const costs = COST_PER_MILLION_TOKENS[model];
  if (!costs) {
    structuredLog("warn", "Unknown model for cost tracking", { model });
    return 0;
  }

  const cost =
    (promptTokens * costs.input + completionTokens * costs.output) / 1_000_000;
  dailySpend += cost;

  structuredLog("info", "LLM cost tracked", {
    model,
    promptTokens,
    completionTokens,
    costUsd: cost.toFixed(6),
    dailySpendUsd: dailySpend.toFixed(4),
    budgetRemaining: (DAILY_BUDGET_USD - dailySpend).toFixed(2),
  });

  return cost;
}

// ============================================================
// PROVIDER CONFIGURATION
// ============================================================

function getGeminiModel() {
  const apiKey = process.env["GOOGLE_GENERATIVE_AI_API_KEY"];
  if (!apiKey) {
    throw new ConfigurationError(
      "GOOGLE_GENERATIVE_AI_API_KEY is not configured"
    );
  }
  // Use gemini-2.0-flash - stable, cost-effective model (Nov 2025)
  return google("gemini-2.0-flash");
}

function getOpenAIModel() {
  const apiKey = process.env["OPENAI_API_KEY"];
  if (!apiKey) {
    throw new ConfigurationError("OPENAI_API_KEY is not configured");
  }
  return openai("gpt-4o-mini");
}

// ============================================================
// MAIN SERVICE FUNCTION
// ============================================================

/**
 * Generate a tarot reading interpretation using LLM.
 *
 * Uses Gemini as primary provider with OpenAI fallback.
 * Returns structured output validated against ReadingOutputSchema.
 *
 * @throws LLMError if all providers fail or budget exceeded
 */
export async function generateReading(
  input: GenerateReadingInput
): Promise<GenerateReadingResult> {
  // Check budget before making API call
  checkBudget();

  const startTime = Date.now();
  const userPrompt = buildUserPrompt(input);

  // Try Gemini first (primary provider - lower cost)
  try {
    const model = getGeminiModel();
    const modelName = "gemini-2.0-flash";

    const result = await generateObject({
      model,
      schema: ReadingOutputSchema,
      system: SYSTEM_PROMPT,
      prompt: userPrompt,
      temperature: 0.7,
    });

    const latencyMs = Date.now() - startTime;
    const promptTokens = result.usage?.inputTokens ?? 0;
    const completionTokens = result.usage?.outputTokens ?? 0;

    trackCost(modelName, promptTokens, completionTokens);

    structuredLog("info", "LLM generation successful", {
      provider: "google",
      model: modelName,
      latencyMs,
      promptTokens,
      completionTokens,
    });

    return {
      output: result.object,
      model: modelName,
      tokensPrompt: promptTokens,
      tokensCompletion: completionTokens,
      latencyMs,
    };
  } catch (geminiError) {
    structuredLog("warn", "Gemini failed, falling back to OpenAI", {
      error:
        geminiError instanceof Error ? geminiError.message : "Unknown error",
    });

    // Fallback to OpenAI
    try {
      const model = getOpenAIModel();
      const modelName = "gpt-4o-mini";

      const result = await generateObject({
        model,
        schema: ReadingOutputSchema,
        system: SYSTEM_PROMPT,
        prompt: userPrompt,
        temperature: 0.7,
      });

      const latencyMs = Date.now() - startTime;
      const promptTokens = result.usage?.inputTokens ?? 0;
      const completionTokens = result.usage?.outputTokens ?? 0;

      trackCost(modelName, promptTokens, completionTokens);

      structuredLog("info", "LLM generation successful (fallback)", {
        provider: "openai",
        model: modelName,
        latencyMs,
        promptTokens,
        completionTokens,
      });

      return {
        output: result.object,
        model: modelName,
        tokensPrompt: promptTokens,
        tokensCompletion: completionTokens,
        latencyMs,
      };
    } catch (openaiError) {
      const latencyMs = Date.now() - startTime;

      structuredLog("error", "All LLM providers failed", {
        latencyMs,
        geminiError:
          geminiError instanceof Error ? geminiError.message : "Unknown",
        openaiError:
          openaiError instanceof Error ? openaiError.message : "Unknown",
      });

      // Provide more helpful error message
      const errorMessage = getProviderErrorMessage(geminiError, openaiError);

      throw new LLMError(errorMessage, "all", {
        geminiError:
          geminiError instanceof Error ? geminiError.message : "Unknown",
        openaiError:
          openaiError instanceof Error ? openaiError.message : "Unknown",
      });
    }
  }
}

/**
 * Extract a helpful error message from provider errors.
 */
function getProviderErrorMessage(
  geminiError: unknown,
  openaiError: unknown
): string {
  // Check for common error types
  const errors = [geminiError, openaiError];

  for (const error of errors) {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();

      if (message.includes("api key") || message.includes("unauthorized")) {
        return "Service configuration error. Please contact support.";
      }

      if (message.includes("rate limit") || message.includes("quota")) {
        return "Service is temporarily busy. Please try again in a few minutes.";
      }

      if (message.includes("timeout")) {
        return "Request timed out. Please try again.";
      }
    }
  }

  return "AI service is temporarily unavailable. Please try again later.";
}

/**
 * Get current budget status.
 * Useful for monitoring and admin dashboards.
 */
export function getBudgetStatus(): {
  dailySpend: number;
  dailyBudget: number;
  remaining: number;
  percentUsed: number;
} {
  checkAndResetDailyBudget();

  return {
    dailySpend,
    dailyBudget: DAILY_BUDGET_USD,
    remaining: Math.max(0, DAILY_BUDGET_USD - dailySpend),
    percentUsed: (dailySpend / DAILY_BUDGET_USD) * 100,
  };
}
