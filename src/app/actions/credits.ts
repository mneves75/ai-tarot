"use server";

import { requireUser } from "@/lib/dal";
import {
  getCreditBalance,
  getCreditTransactionHistory,
  getTotalCreditsSpent,
  getTotalCreditsPurchased,
  type CreditBalance,
  type CreditTransaction,
} from "@/lib/services/credits";

/**
 * Credits Server Actions
 *
 * @module app/actions/credits
 */

// ============================================================
// TYPES
// ============================================================

export interface CreditsOverview {
  balance: number;
  totalSpent: number;
  totalPurchased: number;
  recentTransactions: CreditTransaction[];
}

// ============================================================
// SERVER ACTIONS
// ============================================================

/**
 * Get the current user's credit balance.
 */
export async function getUserCredits(): Promise<CreditBalance | null> {
  const user = await requireUser();
  return getCreditBalance(user.id);
}

/**
 * Get the current user's credits overview.
 * Includes balance, total spent, total purchased, and recent transactions.
 */
export async function getCreditsOverview(): Promise<CreditsOverview | null> {
  const user = await requireUser();

  const [balance, totalSpent, totalPurchased, recentTransactions] =
    await Promise.all([
      getCreditBalance(user.id),
      getTotalCreditsSpent(user.id),
      getTotalCreditsPurchased(user.id),
      getCreditTransactionHistory(user.id, 10),
    ]);

  return {
    balance: balance?.credits ?? 0,
    totalSpent,
    totalPurchased,
    recentTransactions,
  };
}

/**
 * Get the current user's credit transaction history.
 */
export async function getTransactionHistory(
  limit = 20,
  offset = 0
): Promise<CreditTransaction[]> {
  const user = await requireUser();
  return getCreditTransactionHistory(user.id, limit, offset);
}
