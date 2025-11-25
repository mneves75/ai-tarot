import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ReadingOutput } from "@/lib/llm/schemas";

// Hoist mock functions to avoid initialization order issues
const mocks = vi.hoisted(() => ({
  generateObject: vi.fn(),
  google: vi.fn(() => ({ modelId: "gemini-2.0-flash" })),
  openai: vi.fn(() => ({ modelId: "gpt-4o-mini" })),
  structuredLog: vi.fn(),
}));

// Mock the AI SDK
vi.mock("ai", () => ({
  generateObject: mocks.generateObject,
}));

// Mock the provider modules
vi.mock("@ai-sdk/google", () => ({
  google: mocks.google,
}));

vi.mock("@ai-sdk/openai", () => ({
  openai: mocks.openai,
}));

// Mock structuredLog to prevent console noise in tests
vi.mock("@/lib/audit/logger", () => ({
  structuredLog: mocks.structuredLog,
}));

// Import after mocks are set up
import { generateReading, getBudgetStatus, type GenerateReadingInput } from "@/lib/llm/service";

// Valid mock response matching ReadingOutputSchema
const createValidMockResponse = (): ReadingOutput => ({
  summary: "A thoughtful reading about your journey.",
  perCard: [
    {
      position: "presente",
      interpretation:
        "This card represents your current state of mind and the energies surrounding you at this moment in your journey.",
      advice: "Take time to reflect on your path.",
    },
  ],
  overallMessage:
    "The cards suggest a period of reflection and growth. Consider the lessons from your past as you move forward.",
  safetyReminder:
    "Remember that tarot is a tool for symbolic reflection and entertainment, not prediction or professional advice.",
});

const createValidInput = (): GenerateReadingInput => ({
  question: "What guidance do the cards have for me today?",
  cards: [
    {
      name: "The Fool",
      positionRole: "presente",
      orientation: "upright",
      keywords: ["new beginnings", "innocence", "adventure"],
      description: "A figure about to step off a cliff into the unknown.",
    },
  ],
  language: "pt-BR",
});

describe("LLM Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set required env vars
    vi.stubEnv("GOOGLE_GENERATIVE_AI_API_KEY", "test-google-key");
    vi.stubEnv("OPENAI_API_KEY", "test-openai-key");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe("generateReading", () => {
    it("should generate reading successfully with Gemini (primary)", async () => {
      const mockResponse = createValidMockResponse();
      mocks.generateObject.mockResolvedValueOnce({
        object: mockResponse,
        usage: {
          inputTokens: 500,
          outputTokens: 200,
        },
      });

      const input = createValidInput();
      const result = await generateReading(input);

      expect(result.output).toEqual(mockResponse);
      expect(result.model).toBe("gemini-2.0-flash");
      expect(result.tokensPrompt).toBe(500);
      expect(result.tokensCompletion).toBe(200);
      expect(result.latencyMs).toBeGreaterThanOrEqual(0);
      expect(mocks.generateObject).toHaveBeenCalledTimes(1);
    });

    it("should fallback to OpenAI when Gemini fails", async () => {
      const mockResponse = createValidMockResponse();

      // Gemini fails
      mocks.generateObject.mockRejectedValueOnce(new Error("Gemini API error"));

      // OpenAI succeeds
      mocks.generateObject.mockResolvedValueOnce({
        object: mockResponse,
        usage: {
          inputTokens: 600,
          outputTokens: 250,
        },
      });

      const input = createValidInput();
      const result = await generateReading(input);

      expect(result.output).toEqual(mockResponse);
      expect(result.model).toBe("gpt-4o-mini");
      expect(result.tokensPrompt).toBe(600);
      expect(result.tokensCompletion).toBe(250);
      expect(mocks.generateObject).toHaveBeenCalledTimes(2);
    });

    it("should throw LLMError when both providers fail", async () => {
      mocks.generateObject.mockRejectedValueOnce(new Error("Gemini error"));
      mocks.generateObject.mockRejectedValueOnce(new Error("OpenAI error"));

      const input = createValidInput();

      await expect(generateReading(input)).rejects.toThrow();
      expect(mocks.generateObject).toHaveBeenCalledTimes(2);
    });

    it("should handle missing usage data gracefully", async () => {
      const mockResponse = createValidMockResponse();
      mocks.generateObject.mockResolvedValueOnce({
        object: mockResponse,
        usage: undefined, // Missing usage data
      });

      const input = createValidInput();
      const result = await generateReading(input);

      expect(result.tokensPrompt).toBe(0);
      expect(result.tokensCompletion).toBe(0);
    });

    it("should build correct user prompt with card details", async () => {
      const mockResponse = createValidMockResponse();
      mocks.generateObject.mockResolvedValueOnce({
        object: mockResponse,
        usage: { inputTokens: 100, outputTokens: 50 },
      });

      const input: GenerateReadingInput = {
        question: "What does my future hold?",
        cards: [
          {
            name: "The Tower",
            positionRole: "futuro",
            orientation: "reversed",
            keywords: ["transformation", "change", "upheaval"],
            description: "A tower struck by lightning.",
          },
        ],
        language: "en-US",
      };

      await generateReading(input);

      // Verify generateObject was called with expected structure
      const callArgs = mocks.generateObject.mock.calls[0]?.[0];
      expect(callArgs).toBeDefined();
      expect(callArgs.prompt).toContain("What does my future hold?");
      expect(callArgs.prompt).toContain("The Tower");
      expect(callArgs.system).toContain("symbolic");
    });
  });

  describe("getBudgetStatus", () => {
    it("should return initial budget status", () => {
      const status = getBudgetStatus();

      expect(status.dailyBudget).toBe(50);
      expect(status.remaining).toBeGreaterThan(0);
      expect(status.percentUsed).toBeGreaterThanOrEqual(0);
    });
  });

  describe("error handling", () => {
    it("should provide helpful error message for API key errors", async () => {
      mocks.generateObject.mockRejectedValueOnce(
        new Error("Invalid API key provided")
      );
      mocks.generateObject.mockRejectedValueOnce(new Error("Unauthorized"));

      const input = createValidInput();

      await expect(generateReading(input)).rejects.toThrow();
    });

    it("should provide helpful error message for rate limit errors", async () => {
      mocks.generateObject.mockRejectedValueOnce(
        new Error("Rate limit exceeded")
      );
      mocks.generateObject.mockRejectedValueOnce(new Error("Quota exceeded"));

      const input = createValidInput();

      await expect(generateReading(input)).rejects.toThrow();
    });

    it("should provide helpful error message for timeout errors", async () => {
      mocks.generateObject.mockRejectedValueOnce(new Error("Request timeout"));
      mocks.generateObject.mockRejectedValueOnce(new Error("Timeout"));

      const input = createValidInput();

      await expect(generateReading(input)).rejects.toThrow();
    });
  });

  describe("language support", () => {
    it("should handle pt-BR language correctly", async () => {
      const mockResponse = createValidMockResponse();
      mocks.generateObject.mockResolvedValueOnce({
        object: mockResponse,
        usage: { inputTokens: 100, outputTokens: 50 },
      });

      const input = createValidInput();
      input.language = "pt-BR";

      await generateReading(input);

      const callArgs = mocks.generateObject.mock.calls[0]?.[0];
      expect(callArgs.prompt).toContain("português brasileiro");
    });

    it("should handle en-US language correctly", async () => {
      const mockResponse = createValidMockResponse();
      mocks.generateObject.mockResolvedValueOnce({
        object: mockResponse,
        usage: { inputTokens: 100, outputTokens: 50 },
      });

      const input = createValidInput();
      input.language = "en-US";

      await generateReading(input);

      const callArgs = mocks.generateObject.mock.calls[0]?.[0];
      expect(callArgs.prompt).toContain("Respond in English");
    });
  });
});
