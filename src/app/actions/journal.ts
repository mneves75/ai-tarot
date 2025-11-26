"use server";

import { z } from "zod";
import { requireUser } from "@/lib/dal";
import {
  getJournalEntry,
  saveJournalEntry,
  deleteJournalEntry,
  type JournalEntry,
} from "@/lib/services/journal";

/**
 * Journal Server Actions
 *
 * @module app/actions/journal
 */

// ============================================================
// SCHEMAS
// ============================================================

const saveJournalSchema = z.object({
  readingId: z.string().uuid(),
  content: z.string().min(1).max(10000),
});

const deleteJournalSchema = z.object({
  journalId: z.string().uuid(),
});

// ============================================================
// TYPES
// ============================================================

export interface JournalActionResult {
  success: boolean;
  error: string | undefined;
  journal: JournalEntry | undefined;
}

// ============================================================
// SERVER ACTIONS
// ============================================================

/**
 * Get the user's journal entry for a reading.
 */
export async function getUserJournalEntry(
  readingId: string
): Promise<JournalEntry | null> {
  const user = await requireUser();
  return getJournalEntry(readingId, user.id);
}

/**
 * Save (create or update) a journal entry.
 */
export async function saveUserJournalEntry(
  formData: FormData
): Promise<JournalActionResult> {
  const user = await requireUser();

  const rawData = {
    readingId: formData.get("readingId"),
    content: formData.get("content"),
  };

  const validated = saveJournalSchema.safeParse(rawData);
  if (!validated.success) {
    return {
      success: false,
      error: validated.error.issues[0]?.message ?? "Dados inválidos",
      journal: undefined,
    };
  }

  try {
    const journal = await saveJournalEntry(
      validated.data.readingId,
      user.id,
      validated.data.content
    );

    return {
      success: true,
      error: undefined,
      journal,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Erro ao salvar anotação",
      journal: undefined,
    };
  }
}

/**
 * Delete a journal entry.
 */
export async function deleteUserJournalEntry(
  formData: FormData
): Promise<{ success: boolean; error: string | undefined }> {
  const user = await requireUser();

  const rawData = {
    journalId: formData.get("journalId"),
  };

  const validated = deleteJournalSchema.safeParse(rawData);
  if (!validated.success) {
    return {
      success: false,
      error: validated.error.issues[0]?.message ?? "Dados inválidos",
    };
  }

  try {
    const deleted = await deleteJournalEntry(validated.data.journalId, user.id);

    if (!deleted) {
      return {
        success: false,
        error: "Anotação não encontrada",
      };
    }

    return {
      success: true,
      error: undefined,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Erro ao excluir anotação",
    };
  }
}
