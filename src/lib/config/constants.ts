/**
 * Application constants and configuration values.
 *
 * These values can be overridden by environment variables where applicable.
 * See .env.example for environment variable documentation.
 *
 * @module lib/config/constants
 */

// ============================================================
// CREDITS SYSTEM
// ============================================================

/**
 * Welcome credits given to new users on signup.
 */
export const WELCOME_CREDITS = 3;

/**
 * Free readings allowed for guest users (per session).
 */
export const FREE_GUEST_READINGS = 3;

/**
 * Credit cost per reading type.
 */
export const READING_COSTS = {
  one: 1, // Single card reading
  three: 1, // Past/Present/Future reading
  five: 2, // Five card spread
} as const;

// ============================================================
// SESSION & AUTH
// ============================================================

/**
 * Guest session duration in milliseconds (30 days).
 */
export const GUEST_SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Guest session cookie name.
 */
export const GUEST_SESSION_COOKIE = "guest_session_id";

// ============================================================
// RATE LIMITING
// ============================================================

/**
 * Rate limit configurations per endpoint type.
 * Format: { windowMs: number, maxRequests: number }
 */
export const RATE_LIMITS = {
  // Tarot readings - 10 per minute
  reading: { windowMs: 60 * 1000, maxRequests: 10 },
  // Authentication - 10 per 15 minutes
  auth: { windowMs: 15 * 60 * 1000, maxRequests: 10 },
  // Payment operations - 5 per minute
  payment: { windowMs: 60 * 1000, maxRequests: 5 },
  // General API - 60 per minute
  api: { windowMs: 60 * 1000, maxRequests: 60 },
  // Health checks - 120 per minute
  health: { windowMs: 60 * 1000, maxRequests: 120 },
} as const;

// ============================================================
// LLM CONFIGURATION
// ============================================================

/**
 * Maximum tokens for reading generation.
 */
export const LLM_MAX_TOKENS = 2000;

/**
 * Primary model for reading generation.
 */
export const LLM_PRIMARY_MODEL = "gemini-2.0-flash-exp";

/**
 * Fallback model when primary fails.
 */
export const LLM_FALLBACK_MODEL = "gpt-4o-mini";

// ============================================================
// SPREADS
// ============================================================

/**
 * Spread type definitions with position roles.
 */
export const SPREAD_DEFINITIONS = {
  one: {
    name: "Carta Única",
    nameEn: "Single Card",
    positions: [{ role: "mensagem", roleEn: "message" }],
  },
  three: {
    name: "Passado, Presente, Futuro",
    nameEn: "Past, Present, Future",
    positions: [
      { role: "passado", roleEn: "past" },
      { role: "presente", roleEn: "present" },
      { role: "futuro", roleEn: "future" },
    ],
  },
  five: {
    name: "Cruz Celta Simplificada",
    nameEn: "Simplified Celtic Cross",
    positions: [
      { role: "situação", roleEn: "situation" },
      { role: "desafio", roleEn: "challenge" },
      { role: "passado", roleEn: "past" },
      { role: "futuro", roleEn: "future" },
      { role: "conselho", roleEn: "advice" },
    ],
  },
} as const;

// ============================================================
// SUPPORTED LANGUAGES
// ============================================================

export const SUPPORTED_LANGUAGES = ["pt-BR", "en-US"] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

/**
 * Default language for the application.
 */
export const DEFAULT_LANGUAGE: SupportedLanguage = "pt-BR";

// ============================================================
// PAYMENT PACKAGES (Stripe)
// ============================================================

/**
 * Credit packages available for purchase.
 */
export const CREDIT_PACKAGES = [
  {
    id: "credits_10",
    credits: 10,
    priceInCents: 990, // R$ 9,90
    currency: "BRL",
    name: "10 Créditos",
    nameEn: "10 Credits",
  },
  {
    id: "credits_30",
    credits: 30,
    priceInCents: 2490, // R$ 24,90
    currency: "BRL",
    name: "30 Créditos",
    nameEn: "30 Credits",
    popular: true,
  },
  {
    id: "credits_100",
    credits: 100,
    priceInCents: 6990, // R$ 69,90
    currency: "BRL",
    name: "100 Créditos",
    nameEn: "100 Credits",
    bestValue: true,
  },
] as const;

// ============================================================
// UI CONSTANTS
// ============================================================

/**
 * Minimum characters for question input.
 */
export const MIN_QUESTION_LENGTH = 5;

/**
 * Maximum characters for question input.
 */
export const MAX_QUESTION_LENGTH = 500;

/**
 * Maximum characters for journal entry.
 */
export const MAX_JOURNAL_LENGTH = 5000;
