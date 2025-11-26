/**
 * Seed script for tarot deck.
 *
 * Run with: npx tsx src/lib/db/seeds/run-seed.ts
 *
 * This script:
 * 1. Creates the default deck if it doesn't exist
 * 2. Inserts all 78 cards for that deck
 * 3. Is idempotent - safe to run multiple times
 */

import "dotenv/config";
import { db } from "@/lib/db";
import { tarotDecks, tarotCards } from "@/lib/db/schema";
import { TAROT_DECK, DECK_METADATA } from "./tarot-deck";
import { eq, and, isNull } from "drizzle-orm";

async function seed() {
  console.log("Starting tarot deck seed...\n");

  try {
    // 1. Check if default deck exists
    const existingDecks = await db
      .select()
      .from(tarotDecks)
      .where(
        and(
          eq(tarotDecks.isDefault, true),
          eq(tarotDecks.locale, DECK_METADATA.locale),
          isNull(tarotDecks.deletedAt)
        )
      )
      .limit(1);

    let deckId: string;

    if (existingDecks.length > 0 && existingDecks[0]) {
      console.log(`Found existing deck: ${existingDecks[0].name} (${existingDecks[0].id})`);
      deckId = existingDecks[0].id;
    } else {
      // 2. Create the deck
      console.log(`Creating new deck: ${DECK_METADATA.name}`);
      const [newDeck] = await db
        .insert(tarotDecks)
        .values({
          name: DECK_METADATA.name,
          locale: DECK_METADATA.locale,
          isDefault: true,
        })
        .returning();

      if (!newDeck) {
        throw new Error("Failed to create deck");
      }

      deckId = newDeck.id;
      console.log(`Created deck with ID: ${deckId}`);
    }

    // 3. Check existing cards
    const existingCards = await db
      .select({ code: tarotCards.code })
      .from(tarotCards)
      .where(
        and(
          eq(tarotCards.deckId, deckId),
          isNull(tarotCards.deletedAt)
        )
      );

    const existingCodes = new Set(existingCards.map((c) => c.code));
    console.log(`Found ${existingCodes.size} existing cards`);

    // 4. Insert missing cards
    const cardsToInsert = TAROT_DECK.filter(
      (card) => !existingCodes.has(card.code)
    );

    if (cardsToInsert.length === 0) {
      console.log("\nAll cards already exist. Nothing to insert.");
      return;
    }

    console.log(`\nInserting ${cardsToInsert.length} new cards...`);

    // Insert in batches of 20 to avoid overwhelming the database
    const batchSize = 20;
    for (let i = 0; i < cardsToInsert.length; i += batchSize) {
      const batch = cardsToInsert.slice(i, i + batchSize);

      await db.insert(tarotCards).values(
        batch.map((card) => ({
          deckId,
          code: card.code,
          name: card.name,
          arcana: card.arcana,
          suit: card.suit,
          cardIndex: card.cardIndex,
          keywordsUpright: card.keywordsUpright,
          keywordsReversed: card.keywordsReversed,
          descriptionUpright: card.descriptionUpright,
          descriptionReversed: card.descriptionReversed,
          imageUrl: null, // Will be added later
        }))
      );

      console.log(`  Inserted cards ${i + 1} to ${Math.min(i + batchSize, cardsToInsert.length)}`);
    }

    // 5. Verify final count
    const finalCount = await db
      .select({ code: tarotCards.code })
      .from(tarotCards)
      .where(
        and(
          eq(tarotCards.deckId, deckId),
          isNull(tarotCards.deletedAt)
        )
      );

    console.log(`\nSeed complete!`);
    console.log(`Total cards in deck: ${finalCount.length}`);
    console.log(`Expected: ${DECK_METADATA.totalCards}`);

    if (finalCount.length !== DECK_METADATA.totalCards) {
      console.warn(`WARNING: Card count mismatch!`);
    }
  } catch (error) {
    console.error("Seed failed:", error);
    process.exit(1);
  }
}

// Run seed
seed()
  .then(() => {
    console.log("\nDone!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Unexpected error:", error);
    process.exit(1);
  });
