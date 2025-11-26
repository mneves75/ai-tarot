import { relations, sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

// ============================================================
// ENUMS
// ============================================================

export const spreadTypeEnum = pgEnum("spread_type", ["one", "three", "five"]);
export const arcanaEnum = pgEnum("arcana", ["major", "minor"]);
export const suitEnum = pgEnum("suit", [
  "wands",
  "cups",
  "swords",
  "pentacles",
  "none",
]);
export const orientationEnum = pgEnum("orientation", ["upright", "reversed"]);
export const creditTypeEnum = pgEnum("credit_type", [
  "reading",
  "purchase",
  "bonus",
  "adjustment",
  "refund",
  "welcome", // Given on signup
]);
export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "processing", // Payment in progress
  "paid",
  "failed",
  "refunded",
]);

// ============================================================
// PROFILES (Extended user data, Supabase Auth manages core user)
// ============================================================

export const profiles = pgTable(
  "profiles",
  {
    id: uuid("id").primaryKey(), // Same as auth.users.id
    email: text("email").notNull(),
    name: text("name"),
    locale: text("locale").default("pt-BR").notNull(),
    isAdmin: boolean("is_admin").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    deletedAt: timestamp("deleted_at"),
  },
  (table) => [
    // Unique email for active (non-deleted) profiles
    uniqueIndex("profiles_email_idx")
      .on(table.email)
      .where(sql`${table.deletedAt} IS NULL`),
  ]
);

// ============================================================
// GUEST SESSIONS (Anonymous users with limited free readings)
// ============================================================

export const guestSessions = pgTable(
  "guest_sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    freeReadingsUsed: integer("free_readings_used").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    deletedAt: timestamp("deleted_at"),
  },
  (table) => [
    // For cleanup cron job: find expired sessions
    index("guest_sessions_expires_idx").on(table.expiresAt),
  ]
);

// ============================================================
// TAROT DECKS
// ============================================================

export const tarotDecks = pgTable("tarot_decks", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  locale: text("locale").notNull(),
  isDefault: boolean("is_default").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
});

// ============================================================
// TAROT CARDS (78 cards per deck)
// ============================================================

export const tarotCards = pgTable(
  "tarot_cards",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    deckId: uuid("deck_id")
      .references(() => tarotDecks.id)
      .notNull(),
    code: text("code").notNull(), // e.g., 'major_00_the_fool'
    name: text("name").notNull(),
    arcana: arcanaEnum("arcana").notNull(),
    suit: suitEnum("suit").notNull(),
    cardIndex: integer("card_index").notNull(), // 0-77 (renamed from 'index' to avoid SQL reserved word)
    keywordsUpright: jsonb("keywords_upright").notNull().$type<string[]>(),
    keywordsReversed: jsonb("keywords_reversed").notNull().$type<string[]>(),
    descriptionUpright: text("description_upright").notNull(),
    descriptionReversed: text("description_reversed").notNull(),
    imageUrl: text("image_url"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    deletedAt: timestamp("deleted_at"),
  },
  (table) => [
    // Find cards by deck
    index("tarot_cards_deck_idx").on(table.deckId),
    // Unique card code per deck (for active cards)
    uniqueIndex("tarot_cards_code_deck_idx")
      .on(table.code, table.deckId)
      .where(sql`${table.deletedAt} IS NULL`),
  ]
);

// ============================================================
// READINGS (Tarot readings with AI interpretations)
// ============================================================

export const readings = pgTable(
  "readings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => profiles.id),
    guestSessionId: uuid("guest_session_id").references(() => guestSessions.id),
    question: text("question").notNull(),
    questionHash: text("question_hash").notNull(), // SHA-256 for dedup/audit
    spreadType: spreadTypeEnum("spread_type").notNull(),
    language: text("language").default("pt-BR").notNull(),
    summary: text("summary"),
    aiOutput: jsonb("ai_output").$type<ReadingAIOutput>(),
    model: text("model").notNull(),
    tokensPrompt: integer("tokens_prompt"),
    tokensCompletion: integer("tokens_completion"),
    latencyMs: integer("latency_ms"),
    creditsSpent: integer("credits_spent").default(1).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    deletedAt: timestamp("deleted_at"),
  },
  (table) => [
    // User's readings (for history)
    index("readings_user_idx")
      .on(table.userId)
      .where(sql`${table.deletedAt} IS NULL`),
    // Guest's readings
    index("readings_guest_idx").on(table.guestSessionId),
    // Chronological listing
    index("readings_created_idx").on(table.createdAt),
    // Deduplication / audit lookup
    index("readings_question_hash_idx").on(table.questionHash),
  ]
);

// ============================================================
// READING CARDS (Cards drawn in a reading)
// ============================================================

export const readingCards = pgTable(
  "reading_cards",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    readingId: uuid("reading_id")
      .references(() => readings.id, { onDelete: "cascade" })
      .notNull(),
    cardId: uuid("card_id")
      .references(() => tarotCards.id)
      .notNull(),
    positionIndex: integer("position_index").notNull(),
    positionRole: text("position_role").notNull(), // e.g., 'past', 'present', 'future'
    orientation: orientationEnum("orientation").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    // No deleted_at - cards follow reading lifecycle
  },
  (table) => [
    // Get cards for a reading
    index("reading_cards_reading_idx").on(table.readingId),
  ]
);

// ============================================================
// CREDIT BALANCES (Current credit balance per user)
// ============================================================

export const creditBalances = pgTable("credit_balances", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => profiles.id),
  credits: integer("credits").default(0).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  // No deleted_at - balance is tied to profile lifecycle
});

// ============================================================
// CREDIT TRANSACTIONS (AUDIT TRAIL - APPEND ONLY)
// Per AUDIT-GUIDELINES: Never delete or modify financial records
// ============================================================

export const creditTransactions = pgTable(
  "credit_transactions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .references(() => profiles.id)
      .notNull(),
    delta: integer("delta").notNull(), // +N for purchase/bonus, -N for spending
    type: creditTypeEnum("type").notNull(),
    refType: text("ref_type"), // 'reading', 'payment', etc.
    refId: uuid("ref_id"), // ID of related record
    description: text("description"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    // NO deleted_at - APPEND-ONLY AUDIT TRAIL
  },
  (table) => [
    // User's transaction history
    index("credit_transactions_user_idx").on(table.userId),
    // Chronological listing
    index("credit_transactions_created_idx").on(table.createdAt),
  ]
);

// ============================================================
// PAYMENTS (Stripe payment records)
// ============================================================

export const payments = pgTable(
  "payments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .references(() => profiles.id)
      .notNull(),
    provider: text("provider").notNull(), // 'stripe'
    externalId: text("external_id").notNull(), // Stripe Payment Intent ID
    status: paymentStatusEnum("status").notNull(),
    amountCents: integer("amount_cents").notNull(),
    currency: text("currency").default("BRL").notNull(),
    creditsPurchased: integer("credits_purchased").notNull(),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    deletedAt: timestamp("deleted_at"),
  },
  (table) => [
    // User's payment history
    index("payments_user_idx").on(table.userId),
    // Webhook lookup by external ID
    uniqueIndex("payments_external_idx").on(table.externalId),
  ]
);

// ============================================================
// READING JOURNALS (User notes on readings)
// ============================================================

export const readingJournals = pgTable(
  "reading_journals",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    readingId: uuid("reading_id")
      .references(() => readings.id, { onDelete: "cascade" })
      .notNull(),
    userId: uuid("user_id")
      .references(() => profiles.id)
      .notNull(),
    content: text("content").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    deletedAt: timestamp("deleted_at"),
  },
  (table) => [
    // Get journal for a reading
    index("reading_journals_reading_idx").on(table.readingId),
    // User's journal history
    index("reading_journals_user_idx").on(table.userId),
  ]
);

// ============================================================
// AUDIT LOGS (APPEND-ONLY, per AUDIT-GUIDELINES)
// NEVER delete or modify these records
// ============================================================

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    timestamp: timestamp("timestamp").defaultNow().notNull(),
    event: text("event").notNull(), // e.g., 'reading.created', 'auth.login'
    level: text("level").default("info").notNull(), // 'info', 'warn', 'error'
    userId: uuid("user_id"),
    sessionId: text("session_id"),
    requestId: text("request_id"),
    ipAddressHash: text("ip_address_hash"), // SHA-256 hashed for privacy
    userAgent: text("user_agent"),
    resource: text("resource"),
    resourceId: text("resource_id"),
    action: text("action"),
    success: boolean("success").notNull(),
    errorMessage: text("error_message"),
    durationMs: integer("duration_ms"),
    metadata: jsonb("metadata"),
    // NO deleted_at - APPEND-ONLY
  },
  (table) => [
    // Time-based queries (retention policy, recent events)
    index("audit_logs_timestamp_idx").on(table.timestamp),
    // User activity audit
    index("audit_logs_user_idx").on(table.userId),
    // Event type queries
    index("audit_logs_event_idx").on(table.event),
    // Request tracing
    index("audit_logs_request_idx").on(table.requestId),
  ]
);

// Relations
export const profilesRelations = relations(profiles, ({ many, one }) => ({
  readings: many(readings),
  creditBalance: one(creditBalances),
  creditTransactions: many(creditTransactions),
  payments: many(payments),
  journals: many(readingJournals),
}));

export const tarotDecksRelations = relations(tarotDecks, ({ many }) => ({
  cards: many(tarotCards),
}));

export const tarotCardsRelations = relations(tarotCards, ({ one, many }) => ({
  deck: one(tarotDecks, {
    fields: [tarotCards.deckId],
    references: [tarotDecks.id],
  }),
  readingCards: many(readingCards),
}));

export const readingsRelations = relations(readings, ({ one, many }) => ({
  user: one(profiles, {
    fields: [readings.userId],
    references: [profiles.id],
  }),
  guestSession: one(guestSessions, {
    fields: [readings.guestSessionId],
    references: [guestSessions.id],
  }),
  cards: many(readingCards),
  journals: many(readingJournals),
}));

export const readingCardsRelations = relations(readingCards, ({ one }) => ({
  reading: one(readings, {
    fields: [readingCards.readingId],
    references: [readings.id],
  }),
  card: one(tarotCards, {
    fields: [readingCards.cardId],
    references: [tarotCards.id],
  }),
}));

// Types for JSONB fields
export interface ReadingAIOutput {
  summary: string;
  perCard: Array<{
    position: string;
    interpretation: string;
    advice?: string;
  }>;
  overallMessage: string;
  safetyReminder: string;
}
