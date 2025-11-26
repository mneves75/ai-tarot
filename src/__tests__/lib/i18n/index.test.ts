import { describe, it, expect, vi } from "vitest";
import {
  getDictionary,
  isValidLocale,
  t,
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  LOCALE_LABELS,
  ptBR,
  enUS,
} from "@/lib/i18n";

describe("i18n", () => {
  describe("constants", () => {
    it("should have pt-BR as default locale", () => {
      expect(DEFAULT_LOCALE).toBe("pt-BR");
    });

    it("should support pt-BR and en-US locales", () => {
      expect(SUPPORTED_LOCALES).toContain("pt-BR");
      expect(SUPPORTED_LOCALES).toContain("en-US");
      expect(SUPPORTED_LOCALES).toHaveLength(2);
    });

    it("should have labels for all supported locales", () => {
      for (const locale of SUPPORTED_LOCALES) {
        expect(LOCALE_LABELS[locale]).toBeDefined();
        expect(typeof LOCALE_LABELS[locale]).toBe("string");
      }
    });
  });

  describe("isValidLocale", () => {
    it("should return true for supported locales", () => {
      expect(isValidLocale("pt-BR")).toBe(true);
      expect(isValidLocale("en-US")).toBe(true);
    });

    it("should return false for unsupported locales", () => {
      expect(isValidLocale("es-ES")).toBe(false);
      expect(isValidLocale("fr-FR")).toBe(false);
      expect(isValidLocale("")).toBe(false);
    });

    it("should be case sensitive", () => {
      expect(isValidLocale("PT-BR")).toBe(false);
      expect(isValidLocale("pt-br")).toBe(false);
      expect(isValidLocale("EN-US")).toBe(false);
    });
  });

  describe("getDictionary", () => {
    it("should return pt-BR dictionary for pt-BR locale", () => {
      const dict = getDictionary("pt-BR");
      expect(dict.common.loading).toBe("Carregando...");
    });

    it("should return en-US dictionary for en-US locale", () => {
      const dict = getDictionary("en-US");
      expect(dict.common.loading).toBe("Loading...");
    });

    it("should return default (pt-BR) dictionary when no locale provided", () => {
      const dict = getDictionary();
      expect(dict.common.loading).toBe("Carregando...");
    });

    it("should have matching structure between locales", () => {
      const ptKeys = Object.keys(ptBR);
      const enKeys = Object.keys(enUS);

      // Both should have same top-level keys
      expect(ptKeys.sort()).toEqual(enKeys.sort());

      // Check nested keys for common section
      expect(Object.keys(ptBR.common).sort()).toEqual(
        Object.keys(enUS.common).sort()
      );
    });
  });

  describe("t (translate function)", () => {
    it("should translate simple paths", () => {
      const dict = getDictionary("pt-BR");
      expect(t(dict, "common.loading")).toBe("Carregando...");
      expect(t(dict, "common.save")).toBe("Salvar");
    });

    it("should translate nested paths", () => {
      const dict = getDictionary("en-US");
      expect(t(dict, "auth.loginTitle")).toBe("Log In");
      expect(t(dict, "errors.generic")).toBe(
        "Something went wrong. Please try again."
      );
    });

    it("should interpolate parameters", () => {
      const dict = getDictionary("pt-BR");
      expect(t(dict, "payment.simpleReadings", { count: 10 })).toBe(
        "10 leituras simples"
      );
      expect(t(dict, "history.readingsCount", { count: 5 })).toBe(
        "5 leitura no total"
      );
    });

    it("should handle missing translation by returning path", () => {
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      const dict = getDictionary("pt-BR");
      const result = t(dict, "nonexistent.path");

      expect(result).toBe("nonexistent.path");
      expect(consoleSpy).toHaveBeenCalledWith(
        "Translation not found: nonexistent.path"
      );

      consoleSpy.mockRestore();
    });

    it("should handle non-string translation path", () => {
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      const dict = getDictionary("pt-BR");
      // "common" points to an object, not a string
      const result = t(dict, "common");

      expect(result).toBe("common");
      expect(consoleSpy).toHaveBeenCalledWith(
        "Translation path is not a string: common"
      );

      consoleSpy.mockRestore();
    });

    it("should preserve unmatched interpolation placeholders", () => {
      const dict = getDictionary("pt-BR");
      // Pass only partial params
      const result = t(dict, "payment.simpleReadings", {});

      expect(result).toBe("{count} leituras simples");
    });

    it("should handle number parameters", () => {
      const dict = getDictionary("en-US");
      expect(t(dict, "payment.simpleReadings", { count: 100 })).toBe(
        "100 simple readings"
      );
    });
  });

  describe("translation completeness", () => {
    it("should have all auth translations in both locales", () => {
      const authKeys = [
        "loginTitle",
        "loginSubtitle",
        "signupTitle",
        "email",
        "password",
        "loginButton",
        "signupButton",
      ];

      for (const key of authKeys) {
        expect(ptBR.auth[key as keyof typeof ptBR.auth]).toBeDefined();
        expect(enUS.auth[key as keyof typeof enUS.auth]).toBeDefined();
      }
    });

    it("should have all error translations in both locales", () => {
      const errorKeys = [
        "generic",
        "invalidCredentials",
        "insufficientCredits",
        "unauthorized",
      ];

      for (const key of errorKeys) {
        expect(ptBR.errors[key as keyof typeof ptBR.errors]).toBeDefined();
        expect(enUS.errors[key as keyof typeof enUS.errors]).toBeDefined();
      }
    });

    it("should have distinct values between locales", () => {
      // Translations should be different between languages
      expect(ptBR.common.loading).not.toBe(enUS.common.loading);
      expect(ptBR.common.save).not.toBe(enUS.common.save);
      expect(ptBR.auth.loginTitle).not.toBe(enUS.auth.loginTitle);
    });
  });
});
