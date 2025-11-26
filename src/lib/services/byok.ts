/**
 * BYOK (Bring Your Own Key) Service
 *
 * Manages user-provided API keys stored in localStorage.
 * Keys are stored on client-side only and never sent to the server.
 *
 * @module lib/services/byok
 */

// ============================================================
// CONSTANTS
// ============================================================

const STORAGE_PREFIX = "ai-tarot:";
const OPENAI_KEY = `${STORAGE_PREFIX}openai-key`;
const GEMINI_KEY = `${STORAGE_PREFIX}gemini-key`;
const PREFERRED_PROVIDER_KEY = `${STORAGE_PREFIX}preferred-provider`;

/** Credit discount multiplier when using BYOK (50% off) */
export const BYOK_DISCOUNT = 0.5;

// ============================================================
// TYPES
// ============================================================

export type ByokProvider = "openai" | "gemini";
export type PreferredProvider = ByokProvider | "auto";

export interface ByokConfig {
  openaiKey: string | null;
  geminiKey: string | null;
  preferredProvider: PreferredProvider;
}

export interface KeyValidationResult {
  valid: boolean;
  error?: string;
}

// ============================================================
// STORAGE HELPERS
// ============================================================

/**
 * Safely get item from localStorage.
 * Returns null if localStorage is unavailable or on error.
 */
function safeGetItem(key: string): string | null {
  if (typeof window === "undefined") return null;

  try {
    return localStorage.getItem(key);
  } catch {
    // localStorage may fail in private mode or when quota exceeded
    return null;
  }
}

/**
 * Safely set item in localStorage.
 * Silently fails if localStorage is unavailable.
 */
function safeSetItem(key: string, value: string): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(key, value);
  } catch {
    // Silent fail - preference won't persist
  }
}

/**
 * Safely remove item from localStorage.
 */
function safeRemoveItem(key: string): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem(key);
  } catch {
    // Silent fail
  }
}

// ============================================================
// CONFIG FUNCTIONS
// ============================================================

/**
 * Get complete BYOK configuration from localStorage.
 *
 * @returns Current BYOK config with null for unset keys
 */
export function getByokConfig(): ByokConfig {
  const preferredRaw = safeGetItem(PREFERRED_PROVIDER_KEY);
  const preferredProvider: PreferredProvider =
    preferredRaw === "openai" || preferredRaw === "gemini"
      ? preferredRaw
      : "auto";

  return {
    openaiKey: safeGetItem(OPENAI_KEY),
    geminiKey: safeGetItem(GEMINI_KEY),
    preferredProvider,
  };
}

/**
 * Check if user has any valid BYOK key configured.
 *
 * @returns True if at least one API key is set
 */
export function hasByokKey(): boolean {
  const config = getByokConfig();
  return Boolean(config.openaiKey || config.geminiKey);
}

/**
 * Get the active provider based on config.
 * Returns null if no key is available.
 *
 * @returns The provider to use or null
 */
export function getActiveProvider(): ByokProvider | null {
  const config = getByokConfig();

  if (config.preferredProvider !== "auto") {
    // Check if preferred provider has a key
    const keyForPreferred =
      config.preferredProvider === "openai"
        ? config.openaiKey
        : config.geminiKey;
    if (keyForPreferred) return config.preferredProvider;
  }

  // Auto mode: prefer Gemini, fall back to OpenAI
  if (config.geminiKey) return "gemini";
  if (config.openaiKey) return "openai";

  return null;
}

/**
 * Get the API key for the active provider.
 *
 * @returns The API key string or null
 */
export function getActiveKey(): string | null {
  const provider = getActiveProvider();
  if (!provider) return null;

  const config = getByokConfig();
  return provider === "openai" ? config.openaiKey : config.geminiKey;
}

// ============================================================
// KEY MANAGEMENT
// ============================================================

/**
 * Save a BYOK API key to localStorage.
 *
 * @param provider - The provider (openai or gemini)
 * @param key - The API key to save
 */
export function saveByokKey(provider: ByokProvider, key: string): void {
  const storageKey = provider === "openai" ? OPENAI_KEY : GEMINI_KEY;
  safeSetItem(storageKey, key.trim());
}

/**
 * Remove a BYOK API key from localStorage.
 *
 * @param provider - The provider to remove
 */
export function removeByokKey(provider: ByokProvider): void {
  const storageKey = provider === "openai" ? OPENAI_KEY : GEMINI_KEY;
  safeRemoveItem(storageKey);
}

/**
 * Set the preferred provider.
 *
 * @param provider - The preferred provider or 'auto'
 */
export function setPreferredProvider(provider: PreferredProvider): void {
  safeSetItem(PREFERRED_PROVIDER_KEY, provider);
}

/**
 * Clear all BYOK data from localStorage.
 */
export function clearByokData(): void {
  safeRemoveItem(OPENAI_KEY);
  safeRemoveItem(GEMINI_KEY);
  safeRemoveItem(PREFERRED_PROVIDER_KEY);
}

// ============================================================
// KEY VALIDATION
// ============================================================

/**
 * Validate an OpenAI API key by making a test request.
 * Uses the models endpoint which is lightweight.
 *
 * @param key - The API key to validate
 * @returns Validation result with error message if invalid
 */
export async function validateOpenAIKey(
  key: string
): Promise<KeyValidationResult> {
  const trimmedKey = key.trim();

  // Basic format validation
  if (!trimmedKey.startsWith("sk-")) {
    return {
      valid: false,
      error: "OpenAI keys must start with 'sk-'",
    };
  }

  if (trimmedKey.length < 40) {
    return {
      valid: false,
      error: "OpenAI key appears to be too short",
    };
  }

  try {
    const response = await fetch("https://api.openai.com/v1/models", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${trimmedKey}`,
      },
    });

    if (response.ok) {
      return { valid: true };
    }

    if (response.status === 401) {
      return { valid: false, error: "Invalid API key" };
    }

    if (response.status === 429) {
      return { valid: false, error: "Rate limited - key may be valid" };
    }

    return {
      valid: false,
      error: `Validation failed (status ${response.status})`,
    };
  } catch {
    return {
      valid: false,
      error: "Network error - could not validate key",
    };
  }
}

/**
 * Validate a Google Gemini API key by making a test request.
 * Uses the models endpoint which is lightweight.
 *
 * @param key - The API key to validate
 * @returns Validation result with error message if invalid
 */
export async function validateGeminiKey(
  key: string
): Promise<KeyValidationResult> {
  const trimmedKey = key.trim();

  // Basic format validation for Gemini keys
  if (!trimmedKey.startsWith("AIza")) {
    return {
      valid: false,
      error: "Gemini keys typically start with 'AIza'",
    };
  }

  if (trimmedKey.length < 30) {
    return {
      valid: false,
      error: "Gemini key appears to be too short",
    };
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models?key=${trimmedKey}`,
      { method: "GET" }
    );

    if (response.ok) {
      return { valid: true };
    }

    if (response.status === 400 || response.status === 403) {
      return { valid: false, error: "Invalid API key" };
    }

    if (response.status === 429) {
      return { valid: false, error: "Rate limited - key may be valid" };
    }

    return {
      valid: false,
      error: `Validation failed (status ${response.status})`,
    };
  } catch {
    return {
      valid: false,
      error: "Network error - could not validate key",
    };
  }
}

/**
 * Validate a key for a specific provider.
 *
 * @param provider - The provider type
 * @param key - The API key to validate
 * @returns Validation result
 */
export async function validateKey(
  provider: ByokProvider,
  key: string
): Promise<KeyValidationResult> {
  if (provider === "openai") {
    return validateOpenAIKey(key);
  }
  return validateGeminiKey(key);
}

// ============================================================
// CREDIT CALCULATION
// ============================================================

/**
 * Calculate the credit cost with BYOK discount applied.
 *
 * @param baseCost - The base credit cost
 * @returns The discounted cost (rounded up)
 */
export function calculateByokCost(baseCost: number): number {
  if (!hasByokKey()) return baseCost;
  return Math.ceil(baseCost * BYOK_DISCOUNT);
}

// ============================================================
// DISPLAY HELPERS
// ============================================================

/**
 * Mask an API key for display, showing only first 4 and last 4 chars.
 *
 * @param key - The API key to mask
 * @returns Masked key like "sk-a...xyz"
 */
export function maskApiKey(key: string | null): string {
  if (!key || key.length < 12) return "****";

  const start = key.slice(0, 4);
  const end = key.slice(-4);
  return `${start}...${end}`;
}

/**
 * Get display name for a provider.
 *
 * @param provider - The provider
 * @returns Human-readable name
 */
export function getProviderDisplayName(provider: ByokProvider): string {
  return provider === "openai" ? "OpenAI" : "Google Gemini";
}

/**
 * Get the URL to generate API keys for a provider.
 *
 * @param provider - The provider
 * @returns URL to the API key generation page
 */
export function getProviderKeyUrl(provider: ByokProvider): string {
  if (provider === "openai") {
    return "https://platform.openai.com/api-keys";
  }
  return "https://aistudio.google.com/apikey";
}
