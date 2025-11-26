"use server";

import { requireUser } from "@/lib/dal";
import {
  getReadingHistory,
  getReadingDetail,
  getReadingCount,
  type ReadingSummary,
  type ReadingDetail,
} from "@/lib/services/reading-history";

/**
 * Reading History Server Actions
 *
 * @module app/actions/history
 */

// ============================================================
// TYPES
// ============================================================

export interface HistoryPageData {
  readings: ReadingSummary[];
  totalCount: number;
  hasMore: boolean;
}

// ============================================================
// SERVER ACTIONS
// ============================================================

/**
 * Get the user's reading history.
 */
export async function getUserReadingHistory(
  limit = 20,
  offset = 0
): Promise<HistoryPageData> {
  const user = await requireUser();

  const [readings, totalCount] = await Promise.all([
    getReadingHistory(user.id, limit, offset),
    getReadingCount(user.id),
  ]);

  return {
    readings,
    totalCount,
    hasMore: offset + readings.length < totalCount,
  };
}

/**
 * Get a single reading detail.
 */
export async function getUserReadingDetail(
  readingId: string
): Promise<ReadingDetail | null> {
  const user = await requireUser();
  return getReadingDetail(readingId, user.id);
}

/**
 * Get the total count of user readings.
 */
export async function getUserReadingCount(): Promise<number> {
  const user = await requireUser();
  return getReadingCount(user.id);
}
