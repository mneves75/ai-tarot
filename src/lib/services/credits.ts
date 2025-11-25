import "server-only";
import { eq, sql, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  creditBalances,
  creditTransactions,
  type creditTypeEnum,
} from "@/lib/db/schema";
import { auditLog, type AuditLogLevel } from "@/lib/audit/logger";
import { InsufficientCreditsError, NotFoundError } from "@/lib/errors";
import { WELCOME_CREDITS, READING_COSTS } from "@/lib/config/constants";

/**
 * Credits Service
 *
 * Manages user credit balances and transactions.
 * All credit operations MUST go through this service to maintain audit trail.
 *
 * IMPORTANT: This service uses database transactions to ensure consistency.
 *
 * @module lib/services/credits
 */

// ============================================================
// TYPES
// ============================================================

export type CreditType = (typeof creditTypeEnum.enumValues)[number];

export interface CreditBalance {
  userId: string;
  credits: number;
  updatedAt: Date;
}

export interface CreditTransaction {
  id: string;
  userId: string;
  delta: number;
  type: CreditType;
  refType: string | null;
  refId: string | null;
  description: string | null;
  createdAt: Date;
}

export interface CreditOperationResult {
  success: boolean;
  newBalance: number;
  transactionId: string;
}

export interface SpreadType {
  type: "one" | "three" | "five";
}

// ============================================================
// BALANCE OPERATIONS
// ============================================================

/**
 * Get the current credit balance for a user.
 *
 * @param userId - The user ID
 * @returns The credit balance or null if not found
 */
export async function getCreditBalance(
  userId: string
): Promise<CreditBalance | null> {
  const [balance] = await db
    .select()
    .from(creditBalances)
    .where(eq(creditBalances.userId, userId))
    .limit(1);

  return balance ?? null;
}

/**
 * Get or create a credit balance for a user.
 * New users get WELCOME_CREDITS.
 *
 * @param userId - The user ID
 * @returns The credit balance
 */
export async function getOrCreateCreditBalance(
  userId: string
): Promise<CreditBalance> {
  const existing = await getCreditBalance(userId);
  if (existing) {
    return existing;
  }

  // Create new balance with welcome credits
  const [newBalance] = await db
    .insert(creditBalances)
    .values({
      userId,
      credits: WELCOME_CREDITS,
    })
    .returning();

  if (!newBalance) {
    throw new Error("Failed to create credit balance");
  }

  // Record the welcome credits transaction
  await db.insert(creditTransactions).values({
    userId,
    delta: WELCOME_CREDITS,
    type: "welcome",
    description: "Welcome credits for new user",
  });

  await auditLog({
    event: "credits.welcome",
    level: "info" as AuditLogLevel,
    userId,
    sessionId: undefined,
    resource: "credits",
    resourceId: userId,
    action: "welcome",
    success: true,
    errorMessage: undefined,
    durationMs: undefined,
    metadata: { credits: WELCOME_CREDITS },
  });

  return newBalance;
}

/**
 * Check if a user has enough credits for a reading.
 *
 * @param userId - The user ID
 * @param spreadType - The type of spread (determines cost)
 * @returns True if user has enough credits
 */
export async function hasEnoughCredits(
  userId: string,
  spreadType: "one" | "three" | "five"
): Promise<boolean> {
  const balance = await getCreditBalance(userId);
  if (!balance) {
    return false;
  }

  const cost = READING_COSTS[spreadType];
  return balance.credits >= cost;
}

// ============================================================
// CREDIT OPERATIONS (TRANSACTIONAL)
// ============================================================

/**
 * Deduct credits for a reading.
 *
 * Uses a database transaction to ensure atomicity.
 * Records both the balance update and transaction log.
 *
 * @param userId - The user ID
 * @param spreadType - The type of spread (determines cost)
 * @param readingId - The reading ID for reference
 * @returns The operation result
 * @throws InsufficientCreditsError if not enough credits
 */
export async function deductCreditsForReading(
  userId: string,
  spreadType: "one" | "three" | "five",
  readingId: string
): Promise<CreditOperationResult> {
  const cost = READING_COSTS[spreadType];

  return await db.transaction(async (tx) => {
    // Get current balance with lock
    const [balance] = await tx
      .select()
      .from(creditBalances)
      .where(eq(creditBalances.userId, userId))
      .for("update")
      .limit(1);

    if (!balance) {
      throw new NotFoundError("Credit balance", userId);
    }

    if (balance.credits < cost) {
      throw new InsufficientCreditsError(cost, balance.credits);
    }

    // Deduct credits
    const [updated] = await tx
      .update(creditBalances)
      .set({
        credits: sql`${creditBalances.credits} - ${cost}`,
        updatedAt: new Date(),
      })
      .where(eq(creditBalances.userId, userId))
      .returning();

    if (!updated) {
      throw new Error("Failed to update credit balance");
    }

    // Record transaction
    const [transaction] = await tx
      .insert(creditTransactions)
      .values({
        userId,
        delta: -cost,
        type: "reading",
        refType: "reading",
        refId: readingId,
        description: `Reading (${spreadType} card spread)`,
      })
      .returning();

    if (!transaction) {
      throw new Error("Failed to create credit transaction");
    }

    await auditLog({
      event: "credits.deducted",
      level: "info" as AuditLogLevel,
      userId,
      sessionId: undefined,
      resource: "credits",
      resourceId: transaction.id,
      action: "deduct",
      success: true,
      errorMessage: undefined,
      durationMs: undefined,
      metadata: {
        cost,
        spreadType,
        readingId,
        newBalance: updated.credits,
      },
    });

    return {
      success: true,
      newBalance: updated.credits,
      transactionId: transaction.id,
    };
  });
}

/**
 * Add credits from a purchase.
 *
 * @param userId - The user ID
 * @param credits - Number of credits to add
 * @param paymentId - The payment ID for reference
 * @returns The operation result
 */
export async function addCreditsFromPurchase(
  userId: string,
  credits: number,
  paymentId: string
): Promise<CreditOperationResult> {
  return await db.transaction(async (tx) => {
    // Get or create balance
    let [balance] = await tx
      .select()
      .from(creditBalances)
      .where(eq(creditBalances.userId, userId))
      .for("update")
      .limit(1);

    if (!balance) {
      // Create balance if it doesn't exist
      [balance] = await tx
        .insert(creditBalances)
        .values({
          userId,
          credits: 0,
        })
        .returning();
    }

    if (!balance) {
      throw new Error("Failed to get or create credit balance");
    }

    // Add credits
    const [updated] = await tx
      .update(creditBalances)
      .set({
        credits: sql`${creditBalances.credits} + ${credits}`,
        updatedAt: new Date(),
      })
      .where(eq(creditBalances.userId, userId))
      .returning();

    if (!updated) {
      throw new Error("Failed to update credit balance");
    }

    // Record transaction
    const [transaction] = await tx
      .insert(creditTransactions)
      .values({
        userId,
        delta: credits,
        type: "purchase",
        refType: "payment",
        refId: paymentId,
        description: `Purchased ${credits} credits`,
      })
      .returning();

    if (!transaction) {
      throw new Error("Failed to create credit transaction");
    }

    await auditLog({
      event: "credits.purchased",
      level: "info" as AuditLogLevel,
      userId,
      sessionId: undefined,
      resource: "credits",
      resourceId: transaction.id,
      action: "purchase",
      success: true,
      errorMessage: undefined,
      durationMs: undefined,
      metadata: {
        credits,
        paymentId,
        newBalance: updated.credits,
      },
    });

    return {
      success: true,
      newBalance: updated.credits,
      transactionId: transaction.id,
    };
  });
}

/**
 * Add bonus credits (promotional, referral, etc.).
 *
 * @param userId - The user ID
 * @param credits - Number of credits to add
 * @param description - Reason for the bonus
 * @returns The operation result
 */
export async function addBonusCredits(
  userId: string,
  credits: number,
  description: string
): Promise<CreditOperationResult> {
  return await db.transaction(async (tx) => {
    // Ensure balance exists
    const balance = await getOrCreateCreditBalance(userId);

    // Add credits
    const [updated] = await tx
      .update(creditBalances)
      .set({
        credits: sql`${creditBalances.credits} + ${credits}`,
        updatedAt: new Date(),
      })
      .where(eq(creditBalances.userId, userId))
      .returning();

    if (!updated) {
      throw new Error("Failed to update credit balance");
    }

    // Record transaction
    const [transaction] = await tx
      .insert(creditTransactions)
      .values({
        userId,
        delta: credits,
        type: "bonus",
        description,
      })
      .returning();

    if (!transaction) {
      throw new Error("Failed to create credit transaction");
    }

    await auditLog({
      event: "credits.bonus",
      level: "info" as AuditLogLevel,
      userId,
      sessionId: undefined,
      resource: "credits",
      resourceId: transaction.id,
      action: "bonus",
      success: true,
      errorMessage: undefined,
      durationMs: undefined,
      metadata: {
        credits,
        description,
        previousBalance: balance.credits,
        newBalance: updated.credits,
      },
    });

    return {
      success: true,
      newBalance: updated.credits,
      transactionId: transaction.id,
    };
  });
}

/**
 * Process a refund.
 *
 * @param userId - The user ID
 * @param credits - Number of credits to refund
 * @param paymentId - The original payment ID
 * @returns The operation result
 */
export async function refundCredits(
  userId: string,
  credits: number,
  paymentId: string
): Promise<CreditOperationResult> {
  return await db.transaction(async (tx) => {
    // Get current balance
    const [balance] = await tx
      .select()
      .from(creditBalances)
      .where(eq(creditBalances.userId, userId))
      .for("update")
      .limit(1);

    if (!balance) {
      throw new NotFoundError("Credit balance", userId);
    }

    // Deduct refunded credits (can go negative in edge cases)
    const [updated] = await tx
      .update(creditBalances)
      .set({
        credits: sql`${creditBalances.credits} - ${credits}`,
        updatedAt: new Date(),
      })
      .where(eq(creditBalances.userId, userId))
      .returning();

    if (!updated) {
      throw new Error("Failed to update credit balance");
    }

    // Record transaction
    const [transaction] = await tx
      .insert(creditTransactions)
      .values({
        userId,
        delta: -credits,
        type: "refund",
        refType: "payment",
        refId: paymentId,
        description: `Refund for payment ${paymentId}`,
      })
      .returning();

    if (!transaction) {
      throw new Error("Failed to create credit transaction");
    }

    await auditLog({
      event: "credits.refunded",
      level: "warn" as AuditLogLevel,
      userId,
      sessionId: undefined,
      resource: "credits",
      resourceId: transaction.id,
      action: "refund",
      success: true,
      errorMessage: undefined,
      durationMs: undefined,
      metadata: {
        credits,
        paymentId,
        newBalance: updated.credits,
      },
    });

    return {
      success: true,
      newBalance: updated.credits,
      transactionId: transaction.id,
    };
  });
}

// ============================================================
// TRANSACTION HISTORY
// ============================================================

/**
 * Get credit transaction history for a user.
 *
 * @param userId - The user ID
 * @param limit - Maximum number of transactions to return
 * @param offset - Number of transactions to skip
 * @returns List of transactions
 */
export async function getCreditTransactionHistory(
  userId: string,
  limit = 20,
  offset = 0
): Promise<CreditTransaction[]> {
  const transactions = await db
    .select()
    .from(creditTransactions)
    .where(eq(creditTransactions.userId, userId))
    .orderBy(desc(creditTransactions.createdAt))
    .limit(limit)
    .offset(offset);

  return transactions;
}

/**
 * Get total credits spent by a user.
 *
 * @param userId - The user ID
 * @returns Total credits spent
 */
export async function getTotalCreditsSpent(userId: string): Promise<number> {
  const transactions = await db
    .select({
      delta: creditTransactions.delta,
      type: creditTransactions.type,
    })
    .from(creditTransactions)
    .where(eq(creditTransactions.userId, userId));

  // Only count true spending (readings or manual negative adjustments), ignore refunds/other debits.
  return transactions
    .filter(
      (tx) =>
        tx.delta < 0 && (tx.type === "reading" || tx.type === "adjustment")
    )
    .reduce((sum, tx) => sum + Math.abs(tx.delta), 0);
}

/**
 * Get total credits purchased by a user.
 *
 * @param userId - The user ID
 * @returns Total credits purchased
 */
export async function getTotalCreditsPurchased(userId: string): Promise<number> {
  const [result] = await db
    .select({
      total: sql<number>`COALESCE(SUM(${creditTransactions.delta}), 0)`,
    })
    .from(creditTransactions)
    .where(
      sql`${creditTransactions.userId} = ${userId} AND ${creditTransactions.type} = 'purchase'`
    );

  return result?.total ?? 0;
}
