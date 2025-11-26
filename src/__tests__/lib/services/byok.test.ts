import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  getByokConfig,
  hasByokKey,
  getActiveProvider,
  getActiveKey,
  saveByokKey,
  removeByokKey,
  setPreferredProvider,
  clearByokData,
  calculateByokCost,
  maskApiKey,
  getProviderDisplayName,
  getProviderKeyUrl,
  BYOK_DISCOUNT,
} from "@/lib/services/byok";

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

describe("byok service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
  });

  describe("getByokConfig", () => {
    it("returns empty config when no keys are stored", () => {
      const config = getByokConfig();

      expect(config).toEqual({
        openaiKey: null,
        geminiKey: null,
        preferredProvider: "auto",
      });
    });

    it("returns stored keys and provider", () => {
      localStorageMock.setItem("ai-tarot:openai-key", "sk-test-key");
      localStorageMock.setItem("ai-tarot:gemini-key", "AIza-test-key");
      localStorageMock.setItem("ai-tarot:preferred-provider", "openai");

      const config = getByokConfig();

      expect(config.openaiKey).toBe("sk-test-key");
      expect(config.geminiKey).toBe("AIza-test-key");
      expect(config.preferredProvider).toBe("openai");
    });

    it("defaults to auto when preferred provider is invalid", () => {
      localStorageMock.setItem("ai-tarot:preferred-provider", "invalid");

      const config = getByokConfig();

      expect(config.preferredProvider).toBe("auto");
    });
  });

  describe("hasByokKey", () => {
    it("returns false when no keys are stored", () => {
      expect(hasByokKey()).toBe(false);
    });

    it("returns true when openai key is stored", () => {
      localStorageMock.setItem("ai-tarot:openai-key", "sk-test");

      expect(hasByokKey()).toBe(true);
    });

    it("returns true when gemini key is stored", () => {
      localStorageMock.setItem("ai-tarot:gemini-key", "AIza-test");

      expect(hasByokKey()).toBe(true);
    });
  });

  describe("getActiveProvider", () => {
    it("returns null when no keys are stored", () => {
      expect(getActiveProvider()).toBe(null);
    });

    it("returns preferred provider when key exists", () => {
      localStorageMock.setItem("ai-tarot:openai-key", "sk-test");
      localStorageMock.setItem("ai-tarot:preferred-provider", "openai");

      expect(getActiveProvider()).toBe("openai");
    });

    it("falls back to gemini in auto mode", () => {
      localStorageMock.setItem("ai-tarot:gemini-key", "AIza-test");
      localStorageMock.setItem("ai-tarot:openai-key", "sk-test");

      expect(getActiveProvider()).toBe("gemini");
    });

    it("falls back to openai when only openai key exists", () => {
      localStorageMock.setItem("ai-tarot:openai-key", "sk-test");

      expect(getActiveProvider()).toBe("openai");
    });
  });

  describe("getActiveKey", () => {
    it("returns null when no provider is active", () => {
      expect(getActiveKey()).toBe(null);
    });

    it("returns the key for the active provider", () => {
      localStorageMock.setItem("ai-tarot:openai-key", "sk-my-key");
      localStorageMock.setItem("ai-tarot:preferred-provider", "openai");

      expect(getActiveKey()).toBe("sk-my-key");
    });
  });

  describe("saveByokKey", () => {
    it("saves openai key to localStorage", () => {
      saveByokKey("openai", "sk-new-key");

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        "ai-tarot:openai-key",
        "sk-new-key"
      );
    });

    it("saves gemini key to localStorage", () => {
      saveByokKey("gemini", "AIza-new-key");

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        "ai-tarot:gemini-key",
        "AIza-new-key"
      );
    });

    it("trims whitespace from keys", () => {
      saveByokKey("openai", "  sk-key-with-spaces  ");

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        "ai-tarot:openai-key",
        "sk-key-with-spaces"
      );
    });
  });

  describe("removeByokKey", () => {
    it("removes openai key from localStorage", () => {
      removeByokKey("openai");

      expect(localStorageMock.removeItem).toHaveBeenCalledWith(
        "ai-tarot:openai-key"
      );
    });

    it("removes gemini key from localStorage", () => {
      removeByokKey("gemini");

      expect(localStorageMock.removeItem).toHaveBeenCalledWith(
        "ai-tarot:gemini-key"
      );
    });
  });

  describe("setPreferredProvider", () => {
    it("saves preferred provider to localStorage", () => {
      setPreferredProvider("openai");

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        "ai-tarot:preferred-provider",
        "openai"
      );
    });
  });

  describe("clearByokData", () => {
    it("removes all byok data from localStorage", () => {
      clearByokData();

      expect(localStorageMock.removeItem).toHaveBeenCalledWith(
        "ai-tarot:openai-key"
      );
      expect(localStorageMock.removeItem).toHaveBeenCalledWith(
        "ai-tarot:gemini-key"
      );
      expect(localStorageMock.removeItem).toHaveBeenCalledWith(
        "ai-tarot:preferred-provider"
      );
    });
  });

  describe("calculateByokCost", () => {
    it("returns full cost when no BYOK key", () => {
      expect(calculateByokCost(10)).toBe(10);
    });

    it("returns discounted cost when BYOK key exists", () => {
      localStorageMock.setItem("ai-tarot:openai-key", "sk-test");

      // 10 * 0.5 = 5
      expect(calculateByokCost(10)).toBe(5);
    });

    it("rounds up fractional costs", () => {
      localStorageMock.setItem("ai-tarot:openai-key", "sk-test");

      // 3 * 0.5 = 1.5 -> rounds up to 2
      expect(calculateByokCost(3)).toBe(2);
    });

    it("uses correct discount value", () => {
      expect(BYOK_DISCOUNT).toBe(0.5);
    });
  });

  describe("maskApiKey", () => {
    it("returns masked string for valid keys", () => {
      // Shows first 4 chars and last 4 chars
      expect(maskApiKey("sk-abc123xyz789")).toBe("sk-a...z789");
    });

    it("returns **** for null keys", () => {
      expect(maskApiKey(null)).toBe("****");
    });

    it("returns **** for short keys", () => {
      expect(maskApiKey("short")).toBe("****");
    });
  });

  describe("getProviderDisplayName", () => {
    it("returns OpenAI for openai provider", () => {
      expect(getProviderDisplayName("openai")).toBe("OpenAI");
    });

    it("returns Google Gemini for gemini provider", () => {
      expect(getProviderDisplayName("gemini")).toBe("Google Gemini");
    });
  });

  describe("getProviderKeyUrl", () => {
    it("returns OpenAI API keys URL", () => {
      expect(getProviderKeyUrl("openai")).toBe(
        "https://platform.openai.com/api-keys"
      );
    });

    it("returns Google AI Studio URL", () => {
      expect(getProviderKeyUrl("gemini")).toBe(
        "https://aistudio.google.com/apikey"
      );
    });
  });
});
