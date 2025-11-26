import { ptBR } from "./locales/pt-BR";
import { enUS } from "./locales/en-US";

/**
 * Internationalization (i18n) Module
 *
 * Provides type-safe translations for pt-BR and en-US locales.
 *
 * @module lib/i18n
 */

// ============================================================
// TYPES
// ============================================================

export type Locale = "pt-BR" | "en-US";

/**
 * Recursively converts literal string types to string and handles readonly arrays.
 * This allows translations to have the same structure with different string values.
 */
type Widen<T> = T extends string
  ? string
  : T extends readonly (infer U)[]
    ? readonly Widen<U>[]
    : T extends Record<string, unknown>
      ? { readonly [K in keyof T]: Widen<T[K]> }
      : T;

// Translations type is widened from ptBR structure (allows different string values)
export type Translations = Widen<typeof ptBR>;

export type TranslationKey = keyof Translations;

// ============================================================
// CONSTANTS
// ============================================================

export const DEFAULT_LOCALE: Locale = "pt-BR";

export const SUPPORTED_LOCALES: Locale[] = ["pt-BR", "en-US"];

export const LOCALE_LABELS: Record<Locale, string> = {
  "pt-BR": "Português (Brasil)",
  "en-US": "English (US)",
};

// ============================================================
// DICTIONARIES
// ============================================================

const dictionaries: Record<Locale, Translations> = {
  "pt-BR": ptBR,
  "en-US": enUS,
};

// ============================================================
// FUNCTIONS
// ============================================================

/**
 * Get the translations dictionary for a locale.
 *
 * @param locale - The locale code
 * @returns The translations dictionary
 */
export function getDictionary(locale: Locale = DEFAULT_LOCALE): Translations {
  return dictionaries[locale] ?? dictionaries[DEFAULT_LOCALE];
}

/**
 * Check if a locale is supported.
 *
 * @param locale - The locale to check
 * @returns True if supported
 */
export function isValidLocale(locale: string): locale is Locale {
  return SUPPORTED_LOCALES.includes(locale as Locale);
}

/**
 * Get a nested translation value by dot-separated path.
 *
 * @param translations - The translations dictionary
 * @param path - Dot-separated path (e.g., "common.loading")
 * @param params - Optional parameters for interpolation
 * @returns The translated string
 */
export function t(
  translations: Translations,
  path: string,
  params?: Record<string, string | number>
): string {
  const keys = path.split(".");
  let value: unknown = translations;

  for (const key of keys) {
    if (value && typeof value === "object" && key in value) {
      value = (value as Record<string, unknown>)[key];
    } else {
      console.warn(`Translation not found: ${path}`);
      return path;
    }
  }

  if (typeof value !== "string") {
    console.warn(`Translation path is not a string: ${path}`);
    return path;
  }

  // Interpolate parameters
  if (params) {
    return value.replace(/{(\w+)}/g, (_, key: string) => {
      return params[key]?.toString() ?? `{${key}}`;
    });
  }

  return value;
}

// Re-export locales for type inference
export { ptBR, enUS };
