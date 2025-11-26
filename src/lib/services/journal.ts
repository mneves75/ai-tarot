import "server-only";
import { eq, and, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { readingJournals, readings } from "@/lib/db/schema";
import { assertValidUuid } from "@/lib/validation";

/**
 * Journal Service
 *
 * Manages user journal entries for readings.
 * Optimized to minimize database queries.
 *
 * @module lib/services/journal
 */

// ============================================================
// TYPES
// ============================================================

export interface JournalEntry {
  id: string;
  readingId: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================
// FUNCTIONS
// ============================================================

/**
 * Get the journal entry for a reading.
 *
 * Performance: Single JOIN query verifies both existence and authorization.
 * Previous implementation used 2 separate queries.
 *
 * @param readingId - The reading ID
 * @param userId - The user ID (for authorization)
 * @returns The journal entry or null if not found/unauthorized
 */
export async function getJournalEntry(
  readingId: string,
  userId: string
): Promise<JournalEntry | null> {
  assertValidUuid(readingId, "readingId");
  assertValidUuid(userId, "userId");

  // Single JOIN query: verifies reading ownership AND fetches journal
  const [journal] = await db
    .select({
      id: readingJournals.id,
      readingId: readingJournals.readingId,
      content: readingJournals.content,
      createdAt: readingJournals.createdAt,
      updatedAt: readingJournals.updatedAt,
    })
    .from(readingJournals)
    .innerJoin(readings, eq(readingJournals.readingId, readings.id))
    .where(
      and(
        eq(readingJournals.readingId, readingId),
        eq(readingJournals.userId, userId),
        eq(readings.userId, userId), // Verify reading ownership
        isNull(readingJournals.deletedAt),
        isNull(readings.deletedAt)
      )
    )
    .limit(1);

  return journal ?? null;
}

/**
 * Create or update a journal entry for a reading.
 *
 * @param readingId - The reading ID
 * @param userId - The user ID
 * @param content - The journal content
 * @returns The created/updated journal entry
 * @throws Error if reading not found or unauthorized
 */
export async function saveJournalEntry(
  readingId: string,
  userId: string,
  content: string
): Promise<JournalEntry> {
  assertValidUuid(readingId, "readingId");
  assertValidUuid(userId, "userId");

  // Verify reading ownership (required before insert)
  const [reading] = await db
    .select({ id: readings.id })
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
    throw new Error("Reading not found or access denied");
  }

  // Check if journal entry already exists
  const [existing] = await db
    .select({ id: readingJournals.id })
    .from(readingJournals)
    .where(
      and(
        eq(readingJournals.readingId, readingId),
        eq(readingJournals.userId, userId),
        isNull(readingJournals.deletedAt)
      )
    )
    .limit(1);

  if (existing) {
    // Update existing entry
    const [updated] = await db
      .update(readingJournals)
      .set({
        content,
        updatedAt: new Date(),
      })
      .where(eq(readingJournals.id, existing.id))
      .returning({
        id: readingJournals.id,
        readingId: readingJournals.readingId,
        content: readingJournals.content,
        createdAt: readingJournals.createdAt,
        updatedAt: readingJournals.updatedAt,
      });

    if (!updated) {
      throw new Error("Failed to update journal entry");
    }

    return updated;
  }

  // Create new entry
  const [created] = await db
    .insert(readingJournals)
    .values({
      readingId,
      userId,
      content,
    })
    .returning({
      id: readingJournals.id,
      readingId: readingJournals.readingId,
      content: readingJournals.content,
      createdAt: readingJournals.createdAt,
      updatedAt: readingJournals.updatedAt,
    });

  if (!created) {
    throw new Error("Failed to create journal entry");
  }

  return created;
}

/**
 * Delete a journal entry (soft delete).
 *
 * @param journalId - The journal entry ID
 * @param userId - The user ID (for authorization)
 * @returns True if deleted, false if not found
 */
export async function deleteJournalEntry(
  journalId: string,
  userId: string
): Promise<boolean> {
  assertValidUuid(journalId, "journalId");
  assertValidUuid(userId, "userId");

  const result = await db
    .update(readingJournals)
    .set({
      deletedAt: new Date(),
    })
    .where(
      and(
        eq(readingJournals.id, journalId),
        eq(readingJournals.userId, userId),
        isNull(readingJournals.deletedAt)
      )
    )
    .returning({ id: readingJournals.id });

  return result.length > 0;
}
