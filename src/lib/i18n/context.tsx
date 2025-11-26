"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
  type ReactNode,
} from "react";
import {
  getDictionary,
  t,
  DEFAULT_LOCALE,
  isValidLocale,
  type Locale,
  type Translations,
} from "./index";

/**
 * I18n Context
 *
 * Provides locale state and translation functions to React components.
 *
 * @module lib/i18n/context
 */

// ============================================================
// TYPES
// ============================================================

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  translations: Translations;
  t: (path: string, params?: Record<string, string | number>) => string;
}

// ============================================================
// CONTEXT
// ============================================================

const I18nContext = createContext<I18nContextValue | null>(null);

// ============================================================
// PROVIDER
// ============================================================

interface I18nProviderProps {
  children: ReactNode;
  initialLocale?: Locale;
}

/**
 * Detect browser locale preference.
 * Checks localStorage first, then browser navigator.language.
 *
 * @returns Detected locale or default
 */
function detectBrowserLocale(): Locale {
  if (typeof window === "undefined") return DEFAULT_LOCALE;

  try {
    // Check localStorage first (user preference)
    const stored = localStorage.getItem("locale");
    if (stored && isValidLocale(stored)) {
      return stored;
    }

    // Fall back to browser language
    const browserLang = navigator.language;
    if (browserLang.startsWith("pt")) return "pt-BR";
    if (browserLang.startsWith("en")) return "en-US";
  } catch {
    // localStorage may fail in private mode
  }

  return DEFAULT_LOCALE;
}

export function I18nProvider({
  children,
  initialLocale = DEFAULT_LOCALE,
}: I18nProviderProps) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);
  const translations = useMemo(() => getDictionary(locale), [locale]);

  // Hydrate locale from localStorage/browser on mount
  useEffect(() => {
    const detected = detectBrowserLocale();
    setLocaleState(detected);
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    // Persist to localStorage for client-side preference
    // Wrapped in try/catch: localStorage may fail in private mode or quota exceeded
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("locale", newLocale);
      } catch {
        // Silent fail - locale preference won't persist but app continues working
      }
    }
  }, []);

  const translate = useCallback(
    (path: string, params?: Record<string, string | number>) => {
      return t(translations, path, params);
    },
    [translations]
  );

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      translations,
      t: translate,
    }),
    [locale, setLocale, translations, translate]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

// ============================================================
// HOOK
// ============================================================

/**
 * Hook to access i18n context.
 *
 * @returns The i18n context value
 * @throws If used outside I18nProvider
 */
export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return context;
}

/**
 * Convenience hook for just the translation function.
 *
 * @returns The translate function and current locale
 */
export function useTranslation() {
  const { t, locale, translations } = useI18n();
  return { t, locale, translations };
}
