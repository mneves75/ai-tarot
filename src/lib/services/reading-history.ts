import "server-only";
import { eq, desc, and, isNull, count } from "drizzle-orm";
import { db } from "@/lib/db";
import { readings, readingCards, tarotCards } from "@/lib/db/schema";
import type { ReadingAIOutput } from "@/lib/db/schema";
import { assertValidUuid } from "@/lib/validation";

/**
 * Reading History Service
 *
 * Retrieves past readings for users.
 *
 * @module lib/services/reading-history
 */

// ============================================================
// CONSTANTS
// ============================================================

/**
 * Card count per spread type.
 * Used to derive card count without additional queries.
 * This is deterministic: spreadType defines how many cards are drawn.
 */
const SPREAD_CARD_COUNTS: Record<"one" | "three" | "five", number> = {
  one: 1,
  three: 3,
  five: 5,
} as const;

// ============================================================
// TYPES
// ============================================================

export interface ReadingSummary {
  id: string;
  question: string;
  spreadType: "one" | "three" | "five";
  summary: string | null;
  createdAt: Date;
  cardCount: number;
}

export interface ReadingDetail {
  id: string;
  question: string;
  spreadType: "one" | "three" | "five";
  language: string;
  summary: string | null;
  aiOutput: ReadingAIOutput | null;
  model: string;
  latencyMs: number | null;
  createdAt: Date;
  cards: ReadingCardDetail[];
}

export interface ReadingCardDetail {
  id: string;
  positionIndex: number;
  positionRole: string;
  orientation: "upright" | "reversed";
  card: {
    id: string;
    name: string;
    code: string;
    imageUrl: string | null;
    keywordsUpright: string[];
    keywordsReversed: string[];
    descriptionUpright: string;
    descriptionReversed: string;
  };
}

// ============================================================
// FUNCTIONS
// ============================================================

/**
 * Get reading history for a user.
 *
 * Performance: O(1) query - card count derived from spreadType.
 * Previous implementation had N+1 query problem.
 *
 * @param userId - The user ID
 * @param limit - Maximum number of readings to return
 * @param offset - Number of readings to skip
 * @returns List of reading summaries
 */
export async function getReadingHistory(
  userId: string,
  limit = 20,
  offset = 0
): Promise<ReadingSummary[]> {
  assertValidUuid(userId, "userId");

  const results = await db
    .select({
      id: readings.id,
      question: readings.question,
      spreadType: readings.spreadType,
      summary: readings.summary,
      createdAt: readings.createdAt,
    })
    .from(readings)
    .where(and(eq(readings.userId, userId), isNull(readings.deletedAt)))
    .orderBy(desc(readings.createdAt))
    .limit(limit)
    .offset(offset);

  // Card count is deterministic from spreadType - no extra queries needed
  // Defensive fallback to 0 for corrupted data (should never happen in practice)
  return results.map((reading) => ({
    ...reading,
    cardCount: SPREAD_CARD_COUNTS[reading.spreadType] ?? 0,
  }));
}

/**
 * Get a single reading detail by ID.
 *
 * @param readingId - The reading ID
 * @param userId - The user ID (for authorization)
 * @returns The reading detail or null if not found/unauthorized
 */
export async function getReadingDetail(
  readingId: string,
  userId: string
): Promise<ReadingDetail | null> {
  assertValidUuid(readingId, "readingId");
  assertValidUuid(userId, "userId");

  const [reading] = await db
    .select()
    .from(readings)
    .where(
      and(
        eq(readings.id, readingId),
        eq(readings.userId, userId),
        isNull(readings.deletedAt)
      )
    )
    .limit(1);

  if (!reading) {
    return null;
  }

  // Get cards with their details
  const cards = await db
    .select({
      id: readingCards.id,
      positionIndex: readingCards.positionIndex,
      positionRole: readingCards.positionRole,
      orientation: readingCards.orientation,
      card: {
        id: tarotCards.id,
        name: tarotCards.name,
        code: tarotCards.code,
        imageUrl: tarotCards.imageUrl,
        keywordsUpright: tarotCards.keywordsUpright,
        keywordsReversed: tarotCards.keywordsReversed,
        descriptionUpright: tarotCards.descriptionUpright,
        descriptionReversed: tarotCards.descriptionReversed,
      },
    })
    .from(readingCards)
    .innerJoin(tarotCards, eq(readingCards.cardId, tarotCards.id))
    .where(eq(readingCards.readingId, readingId))
    .orderBy(readingCards.positionIndex);

  // Compute imageUrl for each card from code (images stored at /cards/{code}.png)
  const cardsWithComputedImageUrl = cards.map((c) => ({
    ...c,
    card: {
      ...c.card,
      // Compute imageUrl from card code - ensures single source of truth
      imageUrl: `/cards/${c.card.code}.png`,
    },
  }));

  return {
    id: reading.id,
    question: reading.question,
    spreadType: reading.spreadType,
    language: reading.language,
    summary: reading.summary,
    aiOutput: reading.aiOutput,
    model: reading.model,
    latencyMs: reading.latencyMs,
    createdAt: reading.createdAt,
    cards: cardsWithComputedImageUrl,
  };
}

/**
 * Get the total number of readings for a user.
 *
 * Performance: Uses SQL COUNT(*) instead of fetching all rows.
 *
 * @param userId - The user ID
 * @returns The total count
 */
export async function getReadingCount(userId: string): Promise<number> {
  assertValidUuid(userId, "userId");

  const [result] = await db
    .select({ count: count() })
    .from(readings)
    .where(and(eq(readings.userId, userId), isNull(readings.deletedAt)));

  return result?.count ?? 0;
}
