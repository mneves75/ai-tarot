import "server-only";
import { createHash } from "node:crypto";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  tarotDecks,
  tarotCards,
  readings,
  readingCards,
  type ReadingAIOutput,
} from "@/lib/db/schema";
import { NotFoundError, ValidationError } from "@/lib/errors";

/**
 * TarotService - Core business logic for tarot readings.
 *
 * Responsibilities:
 * - Load tarot deck from database
 * - Draw cards with random selection and orientation
 * - Create and persist readings
 * - Hash questions for deduplication/audit
 *
 * @module lib/services/tarot
 */

// ============================================================
// TYPES
// ============================================================

export type SpreadType = "one" | "three" | "five";

export interface SpreadConfig {
  type: SpreadType;
  cardCount: number;
  positions: string[];
  creditsRequired: number;
}

export interface DrawnCard {
  card: {
    id: string;
    code: string;
    name: string;
    arcana: "major" | "minor";
    suit: "wands" | "cups" | "swords" | "pentacles" | "none";
    cardIndex: number;
    keywordsUpright: string[];
    keywordsReversed: string[];
    descriptionUpright: string;
    descriptionReversed: string;
    imageUrl: string | null;
  };
  positionIndex: number;
  positionRole: string;
  orientation: "upright" | "reversed";
}

export interface CreateReadingInput {
  question: string;
  spreadType: SpreadType;
  language: "pt-BR" | "en-US";
  userId: string | undefined;
  guestSessionId: string | undefined;
}

export interface ReadingResult {
  id: string;
  question: string;
  spreadType: SpreadType;
  cards: DrawnCard[];
  summary: string;
  aiOutput: ReadingAIOutput;
  model: string;
  tokensPrompt: number;
  tokensCompletion: number;
  latencyMs: number;
  creditsSpent: number;
  createdAt: Date;
}

// ============================================================
// SPREAD CONFIGURATIONS
// ============================================================

export const SPREAD_CONFIGS: Record<SpreadType, SpreadConfig> = {
  one: {
    type: "one",
    cardCount: 1,
    positions: ["presente"],
    creditsRequired: 1,
  },
  three: {
    type: "three",
    cardCount: 3,
    positions: ["passado", "presente", "futuro"],
    creditsRequired: 1,
  },
  five: {
    type: "five",
    cardCount: 5,
    positions: [
      "situação atual",
      "desafio",
      "passado",
      "futuro",
      "conselho",
    ],
    creditsRequired: 2,
  },
};

// ============================================================
// SERVICE CLASS
// ============================================================

export class TarotService {
  private deckCache: DrawnCard["card"][] | null = null;

  /**
   * Get all cards from the default deck.
   * Results are cached for performance.
   */
  async getDefaultDeck(): Promise<DrawnCard["card"][]> {
    if (this.deckCache) {
      return this.deckCache;
    }

    // Find default deck
    const [deck] = await db
      .select()
      .from(tarotDecks)
      .where(
        and(
          eq(tarotDecks.isDefault, true),
          isNull(tarotDecks.deletedAt)
        )
      )
      .limit(1);

    if (!deck) {
      throw new NotFoundError("Default tarot deck");
    }

    // Get all cards
    const cards = await db
      .select()
      .from(tarotCards)
      .where(
        and(
          eq(tarotCards.deckId, deck.id),
          isNull(tarotCards.deletedAt)
        )
      );

    if (cards.length !== 78) {
      throw new ValidationError(
        `Invalid deck: expected 78 cards, found ${cards.length}`
      );
    }

    this.deckCache = cards.map((card) => ({
      id: card.id,
      code: card.code,
      name: card.name,
      arcana: card.arcana,
      suit: card.suit,
      cardIndex: card.cardIndex,
      keywordsUpright: card.keywordsUpright,
      keywordsReversed: card.keywordsReversed,
      descriptionUpright: card.descriptionUpright,
      descriptionReversed: card.descriptionReversed,
      // Compute imageUrl from card code - images stored at /cards/{code}.png
      // This avoids dependency on DB imageUrl field and ensures single source of truth
      imageUrl: `/cards/${card.code}.png`,
    }));

    return this.deckCache;
  }

  /**
   * Draw cards for a spread.
   *
   * Uses Fisher-Yates shuffle for unbiased random selection.
   * Each card has 50% chance of being reversed.
   *
   * @param spreadType - The type of spread to draw
   * @returns Array of drawn cards with positions and orientations
   */
  async drawCards(spreadType: SpreadType): Promise<DrawnCard[]> {
    const config = SPREAD_CONFIGS[spreadType];
    const deck = await this.getDefaultDeck();

    // Shuffle deck using Fisher-Yates algorithm
    const shuffled = [...deck];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const current = shuffled[i];
      const swap = shuffled[j];

      if (!(current && swap)) {
        throw new ValidationError(
          "Deck shuffle failed: card reference missing during swap"
        );
      }

      shuffled[i] = swap;
      shuffled[j] = current;
    }

    // Draw cards for each position
    const drawnCards: DrawnCard[] = [];

    for (let i = 0; i < config.cardCount; i++) {
      const card = shuffled[i];
      const positionRole = config.positions[i];

      if (!card) {
        throw new ValidationError(
          `Deck draw failed: missing card at index ${i}`
        );
      }

      if (!positionRole) {
        throw new ValidationError(
          `Spread configuration missing position for index ${i}`
        );
      }

      const orientation: "upright" | "reversed" =
        Math.random() < 0.5 ? "upright" : "reversed";

      drawnCards.push({
        card,
        positionIndex: i,
        positionRole,
        orientation,
      });
    }

    return drawnCards;
  }

  /**
   * Hash a question for deduplication and audit purposes.
   *
   * The hash is case-insensitive and trims whitespace.
   *
   * @param question - The user's question
   * @returns SHA-256 hash of the normalized question
   */
  hashQuestion(question: string): string {
    const normalized = question.toLowerCase().trim();
    return createHash("sha256").update(normalized).digest("hex");
  }

  /**
   * Validate a question before creating a reading.
   *
   * @throws ValidationError if question is invalid
   */
  validateQuestion(question: string): void {
    const trimmed = question.trim();

    if (trimmed.length < 10) {
      throw new ValidationError(
        "A pergunta deve ter pelo menos 10 caracteres",
        "question"
      );
    }

    if (trimmed.length > 500) {
      throw new ValidationError(
        "A pergunta deve ter no máximo 500 caracteres",
        "question"
      );
    }
  }

  /**
   * Create a reading and persist it to the database.
   *
   * This method:
   * 1. Validates the question
   * 2. Draws cards
   * 3. Creates the reading record
   * 4. Creates the reading_cards records
   *
   * NOTE: This does NOT call the LLM - that's handled separately.
   *
   * @param input - Reading creation parameters
   * @returns The created reading with drawn cards
   */
  async createReadingRecord(
    input: CreateReadingInput & {
      aiOutput: ReadingAIOutput;
      model: string;
      tokensPrompt: number;
      tokensCompletion: number;
      latencyMs: number;
    }
  ): Promise<ReadingResult> {
    // 1. Validate question
    this.validateQuestion(input.question);

    // 2. Draw cards
    const drawnCards = await this.drawCards(input.spreadType);
    const config = SPREAD_CONFIGS[input.spreadType];

    // 3. Create reading in transaction
    const result = await db.transaction(async (tx) => {
      // Insert reading
      const [reading] = await tx
        .insert(readings)
        .values({
          userId: input.userId,
          guestSessionId: input.guestSessionId,
          question: input.question.trim(),
          questionHash: this.hashQuestion(input.question),
          spreadType: input.spreadType,
          language: input.language,
          summary: input.aiOutput.summary,
          aiOutput: input.aiOutput,
          model: input.model,
          tokensPrompt: input.tokensPrompt,
          tokensCompletion: input.tokensCompletion,
          latencyMs: input.latencyMs,
          creditsSpent: config.creditsRequired,
        })
        .returning();

      if (!reading) {
        throw new Error("Failed to create reading");
      }

      // Insert reading cards
      await tx.insert(readingCards).values(
        drawnCards.map((drawn) => ({
          readingId: reading.id,
          cardId: drawn.card.id,
          positionIndex: drawn.positionIndex,
          positionRole: drawn.positionRole,
          orientation: drawn.orientation,
        }))
      );

      return reading;
    });

    return {
      id: result.id,
      question: result.question,
      spreadType: result.spreadType,
      cards: drawnCards,
      summary: result.summary ?? "",
      aiOutput: (() => {
        if (!result.aiOutput) {
          throw new ValidationError("AI output missing from reading result");
        }
        return result.aiOutput;
      })(),
      model: result.model,
      tokensPrompt: result.tokensPrompt ?? 0,
      tokensCompletion: result.tokensCompletion ?? 0,
      latencyMs: result.latencyMs ?? 0,
      creditsSpent: result.creditsSpent,
      createdAt: result.createdAt,
    };
  }

  /**
   * Get spread configuration.
   */
  getSpreadConfig(spreadType: SpreadType): SpreadConfig {
    return SPREAD_CONFIGS[spreadType];
  }

  /**
   * Prepare card data for LLM prompt.
   *
   * Formats the drawn cards into a structure suitable for the AI prompt,
   * including the appropriate description based on orientation.
   */
  prepareCardsForPrompt(
    drawnCards: DrawnCard[]
  ): Array<{
    name: string;
    positionRole: string;
    orientation: "upright" | "reversed";
    keywords: string[];
    description: string;
  }> {
    return drawnCards.map((drawn) => ({
      name: drawn.card.name,
      positionRole: drawn.positionRole,
      orientation: drawn.orientation,
      keywords:
        drawn.orientation === "upright"
          ? drawn.card.keywordsUpright
          : drawn.card.keywordsReversed,
      description:
        drawn.orientation === "upright"
          ? drawn.card.descriptionUpright
          : drawn.card.descriptionReversed,
    }));
  }
}

// Singleton instance for server-side use
let tarotServiceInstance: TarotService | null = null;

export function getTarotService(): TarotService {
  if (!tarotServiceInstance) {
    tarotServiceInstance = new TarotService();
  }
  return tarotServiceInstance;
}
