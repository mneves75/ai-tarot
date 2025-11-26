import "server-only";
import { eq, sql, desc, and, gte } from "drizzle-orm";
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

    // HIGH-7 FIX: Deduct credits with floor constraint
    // Use GREATEST(0, ...) as a safety net, and verify the result
    const [updated] = await tx
      .update(creditBalances)
      .set({
        credits: sql`GREATEST(0, ${creditBalances.credits} - ${cost})`,
        updatedAt: new Date(),
      })
      .where(eq(creditBalances.userId, userId))
      .returning();

    if (!updated) {
      throw new Error("Failed to update credit balance");
    }

    // HIGH-7 FIX: Defense-in-depth verification
    // If GREATEST kicked in, it means something went wrong with our pre-check
    if (updated.credits < 0) {
      throw new Error("Credit balance floor constraint violated");
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
// ATOMIC CREDIT RESERVATION (CRIT-1 FIX)
// ============================================================

/**
 * Atomically reserve credits for a reading BEFORE expensive operations.
 * This prevents race conditions where concurrent requests could all pass
 * the credit check before any deduction occurs.
 *
 * Pattern:
 * 1. Reserve credits atomically (this function)
 * 2. Perform expensive operations (LLM call, etc.)
 * 3. On success: confirmCreditReservation()
 * 4. On failure: refundCreditReservation()
 *
 * @param userId - The user ID
 * @param spreadType - The type of spread (determines cost)
 * @returns Object with transactionId and cost, or null if insufficient credits
 */
export async function reserveCreditsForReading(
  userId: string,
  spreadType: "one" | "three" | "five"
): Promise<{ transactionId: string; cost: number } | null> {
  const cost = READING_COSTS[spreadType];

  try {
    return await db.transaction(async (tx) => {
      // Get current balance with exclusive lock to prevent concurrent reads
      const [balance] = await tx
        .select()
        .from(creditBalances)
        .where(eq(creditBalances.userId, userId))
        .for("update")
        .limit(1);

      if (!balance || balance.credits < cost) {
        // Not enough credits - return null, don't throw
        return null;
      }

      // HIGH-7 FIX: Atomically deduct credits with floor constraint
      const [updated] = await tx
        .update(creditBalances)
        .set({
          credits: sql`GREATEST(0, ${creditBalances.credits} - ${cost})`,
          updatedAt: new Date(),
        })
        .where(eq(creditBalances.userId, userId))
        .returning();

      if (!updated) {
        throw new Error("Failed to reserve credits");
      }

      // HIGH-7 FIX: Defense-in-depth verification
      if (updated.credits < 0) {
        throw new Error("Credit balance floor constraint violated during reservation");
      }

      // Record pending transaction (will be confirmed or refunded)
      const [transaction] = await tx
        .insert(creditTransactions)
        .values({
          userId,
          delta: -cost,
          type: "reading",
          description: `Reserved for ${spreadType} card reading (pending)`,
        })
        .returning();

      if (!transaction) {
        throw new Error("Failed to create credit reservation");
      }

      await auditLog({
        event: "credits.reserved",
        level: "info" as AuditLogLevel,
        userId,
        sessionId: undefined,
        resource: "credits",
        resourceId: transaction.id,
        action: "reserve",
        success: true,
        errorMessage: undefined,
        durationMs: undefined,
        metadata: {
          cost,
          spreadType,
          newBalance: updated.credits,
        },
      });

      return { transactionId: transaction.id, cost };
    });
  } catch (error) {
    // HIGH-6 FIX: Log credit operation failures
    await auditLog({
      event: "credits.reserve_failed",
      level: "error" as AuditLogLevel,
      userId,
      sessionId: undefined,
      resource: "credits",
      resourceId: undefined,
      action: "reserve",
      success: false,
      errorMessage: error instanceof Error ? error.message : "Unknown error",
      durationMs: undefined,
      metadata: { spreadType, cost },
    });
    throw error;
  }
}

/**
 * Confirm a credit reservation after successful reading creation.
 * Updates the transaction description to show it was confirmed.
 *
 * @param transactionId - The reservation transaction ID
 * @param readingId - The created reading ID
 */
export async function confirmCreditReservation(
  transactionId: string,
  readingId: string
): Promise<void> {
  await db
    .update(creditTransactions)
    .set({
      refType: "reading",
      refId: readingId,
      description: sql`REPLACE(${creditTransactions.description}, '(pending)', '(confirmed)')`,
    })
    .where(eq(creditTransactions.id, transactionId));
}

/**
 * Refund a credit reservation if the reading creation fails.
 * Adds credits back and creates a refund transaction.
 *
 * @param userId - The user ID
 * @param transactionId - The original reservation transaction ID
 * @param cost - The amount to refund
 * @param reason - Reason for refund
 */
export async function refundCreditReservation(
  userId: string,
  transactionId: string,
  cost: number,
  reason: string
): Promise<void> {
  await db.transaction(async (tx) => {
    // Add credits back
    await tx
      .update(creditBalances)
      .set({
        credits: sql`${creditBalances.credits} + ${cost}`,
        updatedAt: new Date(),
      })
      .where(eq(creditBalances.userId, userId));

    // Update original transaction to show it was refunded
    await tx
      .update(creditTransactions)
      .set({
        description: sql`REPLACE(${creditTransactions.description}, '(pending)', '(refunded: ' || ${reason} || ')')`,
      })
      .where(eq(creditTransactions.id, transactionId));

    // Create refund transaction
    await tx.insert(creditTransactions).values({
      userId,
      delta: cost,
      type: "adjustment",
      refType: "credit_transaction",
      refId: transactionId,
      description: `Refund for failed reading: ${reason}`,
    });
  });

  await auditLog({
    event: "credits.reservation_refunded",
    level: "warn" as AuditLogLevel,
    userId,
    sessionId: undefined,
    resource: "credits",
    resourceId: transactionId,
    action: "refund_reservation",
    success: true,
    errorMessage: undefined,
    durationMs: undefined,
    metadata: { cost, reason },
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
  // CRIT-3 FIX: Use proper parameterized query builder instead of raw SQL
  const [result] = await db
    .select({
      total: sql<number>`COALESCE(SUM(${creditTransactions.delta}), 0)`,
    })
    .from(creditTransactions)
    .where(
      and(
        eq(creditTransactions.userId, userId),
        eq(creditTransactions.type, "purchase")
      )
    );

  return result?.total ?? 0;
}
