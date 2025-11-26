"use server";

import { z } from "zod";
import { getUser } from "@/lib/dal";
import { checkRateLimit, RATE_LIMITS } from "@/lib/utils/rate-limit";
import { getTarotService, type DrawnCard, type SpreadType } from "@/lib/services/tarot";
import { generateReading } from "@/lib/llm/service";
import { auditLog, createAuditTimer, AuditEvents } from "@/lib/audit/logger";
import {
  ValidationError,
  RateLimitError,
  InsufficientCreditsError,
  QuotaExhaustedError,
  toAppError,
  toClientSafeError,
} from "@/lib/errors";
import type { ReadingAIOutput } from "@/lib/db/schema";
import {
  reserveCreditsForReading,
  confirmCreditReservation,
  refundCreditReservation,
} from "@/lib/services/credits";
import {
  getOrCreateGuestSession,
  canGuestRead,
  incrementGuestReadingsUsed,
} from "@/lib/services/guest-session";

/**
 * Server Action for creating a tarot reading.
 *
 * This action handles:
 * 1. Input validation
 * 2. Rate limiting
 * 3. Card drawing
 * 4. AI interpretation generation
 * 5. Persistence to database
 * 6. Audit logging
 *
 * @module app/actions/reading
 */

// ============================================================
// INPUT VALIDATION
// ============================================================

const CreateReadingSchema = z.object({
  question: z
    .string()
    .min(10, "A pergunta deve ter pelo menos 10 caracteres")
    .max(500, "A pergunta deve ter no máximo 500 caracteres"),
  spreadType: z.enum(["one", "three", "five"]),
  language: z.enum(["pt-BR", "en-US"]).default("pt-BR"),
});

export type CreateReadingInput = z.infer<typeof CreateReadingSchema>;

// ============================================================
// RESPONSE TYPES
// ============================================================

export interface ReadingCard {
  name: string;
  code: string;
  positionRole: string;
  orientation: "upright" | "reversed";
  keywords: string[];
  description: string;
  imageUrl: string | null;
}

export interface CreateReadingSuccessResult {
  success: true;
  data: {
    readingId: string;
    question: string;
    spreadType: SpreadType;
    cards: ReadingCard[];
    summary: string;
    perCard: Array<{
      position: string;
      interpretation: string;
      advice: string | undefined;
    }>;
    overallMessage: string;
    safetyReminder: string;
    model: string;
    latencyMs: number;
    createdAt: string;
  };
}

export interface CreateReadingErrorResult {
  success: false;
  error: {
    code: string;
    message: string;
    field: string | undefined;
  };
}

export type CreateReadingResult =
  | CreateReadingSuccessResult
  | CreateReadingErrorResult;

// ============================================================
// SERVER ACTION
// ============================================================

/**
 * Create a new tarot reading.
 *
 * This is a Server Action that can be called from client components.
 * It handles all validation, rate limiting, AI generation, and persistence.
 *
 * @example
 * ```tsx
 * const result = await createReading({
 *   question: "What guidance do the cards have for my career?",
 *   spreadType: "three",
 *   language: "pt-BR",
 * });
 *
 * if (result.success) {
 *   console.log(result.data.summary);
 * } else {
 *   console.error(result.error.message);
 * }
 * ```
 */
export async function createReading(
  input: CreateReadingInput
): Promise<CreateReadingResult> {
  const timer = createAuditTimer();
  let userId: string | undefined;
  let guestSessionId: string | undefined;

  // CRIT-1 FIX: Track credit reservation for rollback on failure
  let creditReservation: { transactionId: string; cost: number } | null = null;

  try {
    // 1. Rate limit check
    const rateLimit = await checkRateLimit(undefined, RATE_LIMITS.reading);
    if (rateLimit.isLimited) {
      throw new RateLimitError(rateLimit.resetInMs);
    }

    // 2. Validate input
    const validationResult = CreateReadingSchema.safeParse(input);
    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0];
      throw new ValidationError(
        firstError?.message ?? "Entrada inválida",
        firstError?.path.join(".")
      );
    }

    const validatedInput = validationResult.data;

    // 3. Get user context
    const user = await getUser();
    userId = user?.id;

    // 4. CRIT-1 FIX: Reserve credits/quota ATOMICALLY BEFORE expensive operations
    // This prevents race conditions where concurrent requests could all pass
    // the credit check before any deduction occurs.
    if (user) {
      // Authenticated user: Atomically reserve credits FIRST
      creditReservation = await reserveCreditsForReading(
        user.id,
        validatedInput.spreadType
      );

      if (!creditReservation) {
        // Reservation failed = insufficient credits
        const requiredCredits = validatedInput.spreadType === "five" ? 2 : 1;
        throw new InsufficientCreditsError(requiredCredits, 0);
      }
    } else {
      // Guest user: Check and atomically reserve quota
      const guestSession = await getOrCreateGuestSession();
      if (!guestSession) {
        throw new QuotaExhaustedError();
      }
      guestSessionId = guestSession.id;

      // HIGH-8 FIX: Use atomic increment with check for guest quota
      const canRead = await canGuestRead(guestSession.id);
      if (!canRead) {
        throw new QuotaExhaustedError();
      }

      // Reserve the guest quota immediately (increment before expensive ops)
      await incrementGuestReadingsUsed(guestSessionId);
    }

    // 5. Initialize service and draw cards
    const tarotService = getTarotService();
    const drawnCards = await tarotService.drawCards(validatedInput.spreadType);

    // 6. Prepare cards for LLM prompt
    const cardsForPrompt = tarotService.prepareCardsForPrompt(drawnCards);

    // 7. Generate AI interpretation (expensive operation - credits already reserved)
    const llmResult = await generateReading({
      question: validatedInput.question,
      cards: cardsForPrompt,
      language: validatedInput.language,
    });

    // 8. Create reading record in database
    const reading = await tarotService.createReadingRecord({
      question: validatedInput.question,
      spreadType: validatedInput.spreadType,
      language: validatedInput.language,
      userId,
      guestSessionId,
      aiOutput: llmResult.output as ReadingAIOutput,
      model: llmResult.model,
      tokensPrompt: llmResult.tokensPrompt,
      tokensCompletion: llmResult.tokensCompletion,
      latencyMs: llmResult.latencyMs,
    });

    // 9. CRIT-1 FIX: Confirm credit reservation (mark as used, link to reading)
    if (user && creditReservation) {
      await confirmCreditReservation(creditReservation.transactionId, reading.id);
    }

    // 10. Audit log success
    await auditLog({
      event: AuditEvents.READING_CREATED,
      level: "info",
      userId,
      sessionId: undefined,
      resource: "readings",
      resourceId: reading.id,
      action: "create",
      success: true,
      errorMessage: undefined,
      durationMs: timer(),
      metadata: {
        spreadType: validatedInput.spreadType,
        language: validatedInput.language,
        model: llmResult.model,
        cardsDrawn: drawnCards.length,
      },
    });

    // 11. Format response
    return {
      success: true,
      data: {
        readingId: reading.id,
        question: reading.question,
        spreadType: reading.spreadType,
        cards: formatCardsForClient(drawnCards),
        summary: llmResult.output.summary,
        perCard: llmResult.output.perCard.map((card) => ({
          position: card.position,
          interpretation: card.interpretation,
          advice: card.advice,
        })),
        overallMessage: llmResult.output.overallMessage,
        safetyReminder: llmResult.output.safetyReminder,
        model: reading.model,
        latencyMs: reading.latencyMs,
        createdAt: reading.createdAt.toISOString(),
      },
    };
  } catch (error) {
    // CRIT-1 FIX: Refund reserved credits on failure
    if (userId && creditReservation) {
      try {
        await refundCreditReservation(
          userId,
          creditReservation.transactionId,
          creditReservation.cost,
          error instanceof Error ? error.message : "Unknown error"
        );
      } catch (refundError) {
        // Log refund failure but don't mask original error
        console.error("Failed to refund credit reservation:", refundError);
      }
    }

    // Audit log failure
    const appError = toAppError(error);

    await auditLog({
      event: AuditEvents.READING_CREATED,
      level: "error",
      userId,
      sessionId: undefined,
      resource: "readings",
      resourceId: undefined,
      action: "create",
      success: false,
      errorMessage: appError.message,
      durationMs: timer(),
      metadata: {
        errorCode: appError.code,
        isOperational: appError.isOperational,
        creditReservationRefunded: !!creditReservation,
      },
    });

    // Return client-safe error
    const clientError = toClientSafeError(error);
    return {
      success: false,
      error: {
        code: clientError.code,
        message: clientError.message,
        field: error instanceof ValidationError ? error.field : undefined,
      },
    };
  }
}

// ============================================================
// HELPERS
// ============================================================

/**
 * Format drawn cards for client consumption.
 * Selects appropriate keywords and description based on orientation.
 */
function formatCardsForClient(drawnCards: DrawnCard[]): ReadingCard[] {
  return drawnCards.map((drawn) => ({
    name: drawn.card.name,
    code: drawn.card.code,
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
    imageUrl: drawn.card.imageUrl,
  }));
}
