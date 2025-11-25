import { describe, it, expect } from "vitest";
import {
  SYSTEM_PROMPT,
  buildUserPrompt,
  buildBlockedTopicResponse,
} from "@/lib/llm/prompts";

describe("LLM Prompts", () => {
  describe("SYSTEM_PROMPT", () => {
    it("should contain role definition", () => {
      expect(SYSTEM_PROMPT).toContain("tarot reader");
      expect(SYSTEM_PROMPT).toContain("empathetic");
    });

    it("should contain safety rules", () => {
      expect(SYSTEM_PROMPT).toContain("CRITICAL SAFETY RULES");
      expect(SYSTEM_PROMPT).toContain("Symbolic reflection only");
      expect(SYSTEM_PROMPT).toContain("No certainty claims");
      expect(SYSTEM_PROMPT).toContain("No advice on");
      expect(SYSTEM_PROMPT).toContain("No diagnosis");
    });

    it("should contain hard blocks for sensitive topics", () => {
      expect(SYSTEM_PROMPT).toContain("HARD BLOCKS");
      expect(SYSTEM_PROMPT).toContain("Medical");
      expect(SYSTEM_PROMPT).toContain("Legal");
      expect(SYSTEM_PROMPT).toContain("Financial");
      expect(SYSTEM_PROMPT).toContain("Mental health");
    });
  });

  describe("buildUserPrompt", () => {
    const createInput = (overrides = {}) => ({
      question: "What guidance do the cards have for my career?",
      cards: [
        {
          name: "The Fool",
          positionRole: "presente",
          orientation: "upright" as const,
          keywords: ["new beginnings", "spontaneity"],
          description: "A new journey begins",
        },
      ],
      language: "pt-BR" as const,
      ...overrides,
    });

    it("should include the question in the prompt", () => {
      const input = createInput();
      const prompt = buildUserPrompt(input);

      expect(prompt).toContain(input.question);
    });

    it("should include card information", () => {
      const input = createInput();
      const prompt = buildUserPrompt(input);

      expect(prompt).toContain("The Fool");
      expect(prompt).toContain("presente");
      expect(prompt).toContain("new beginnings");
      expect(prompt).toContain("A new journey begins");
    });

    it("should use Portuguese language instruction for pt-BR", () => {
      const input = createInput({ language: "pt-BR" });
      const prompt = buildUserPrompt(input);

      expect(prompt).toContain("Responda em português brasileiro");
    });

    it("should use English language instruction for en-US", () => {
      const input = createInput({ language: "en-US" });
      const prompt = buildUserPrompt(input);

      expect(prompt).toContain("Respond in English");
    });

    it("should handle multiple cards", () => {
      const input = createInput({
        cards: [
          {
            name: "The Fool",
            positionRole: "passado",
            orientation: "upright",
            keywords: ["beginnings"],
            description: "New start",
          },
          {
            name: "The Tower",
            positionRole: "presente",
            orientation: "reversed",
            keywords: ["change"],
            description: "Upheaval",
          },
          {
            name: "The Star",
            positionRole: "futuro",
            orientation: "upright",
            keywords: ["hope"],
            description: "Hope ahead",
          },
        ],
      });
      const prompt = buildUserPrompt(input);

      expect(prompt).toContain("The Fool");
      expect(prompt).toContain("The Tower");
      expect(prompt).toContain("The Star");
      expect(prompt).toContain("passado");
      expect(prompt).toContain("presente");
      expect(prompt).toContain("futuro");
    });

    it("should indicate reversed cards correctly", () => {
      const input = createInput({
        cards: [
          {
            name: "The Tower",
            positionRole: "presente",
            orientation: "reversed",
            keywords: ["change"],
            description: "Upheaval averted",
          },
        ],
      });
      const prompt = buildUserPrompt(input);

      expect(prompt).toContain("invertida");
    });

    it("should indicate upright cards correctly", () => {
      const input = createInput({
        cards: [
          {
            name: "The Star",
            positionRole: "presente",
            orientation: "upright",
            keywords: ["hope"],
            description: "Hope shines",
          },
        ],
      });
      const prompt = buildUserPrompt(input);

      expect(prompt).toContain("normal");
    });

    it("should include safety reminder instructions", () => {
      const input = createInput();
      const prompt = buildUserPrompt(input);

      expect(prompt).toContain("lembrete de segurança");
    });
  });

  describe("buildBlockedTopicResponse", () => {
    it("should return Portuguese response for pt-BR", () => {
      const response = buildBlockedTopicResponse("questões médicas", "pt-BR");

      expect(response).toContain("profissional qualificado");
      expect(response).toContain("questões médicas");
    });

    it("should return English response for en-US", () => {
      const response = buildBlockedTopicResponse("medical issues", "en-US");

      expect(response).toContain("qualified professional");
      expect(response).toContain("medical issues");
    });

    it("should offer alternative reading focused on feelings", () => {
      const ptResponse = buildBlockedTopicResponse("finanças", "pt-BR");
      const enResponse = buildBlockedTopicResponse("finances", "en-US");

      expect(ptResponse).toContain("autoconhecimento");
      expect(enResponse).toContain("self-awareness");
    });
  });
});
