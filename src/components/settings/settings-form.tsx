"use client";

import { useState, useCallback, useEffect } from "react";
import { useTranslation, useI18n } from "@/lib/i18n/context";
import { type Locale, SUPPORTED_LOCALES, LOCALE_LABELS } from "@/lib/i18n";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ApiKeyInput } from "./api-key-input";
import {
  getByokConfig,
  hasByokKey,
  setPreferredProvider,
  type PreferredProvider,
  type ByokConfig,
} from "@/lib/services/byok";
import { Globe, Key, Sparkles } from "lucide-react";

/**
 * Main settings form component.
 *
 * Sections:
 * 1. Language preference
 * 2. BYOK API keys (OpenAI, Gemini)
 * 3. Preferred provider selection
 */
export function SettingsForm() {
  const { t } = useTranslation();
  const { locale, setLocale } = useI18n();
  const [byokConfig, setByokConfig] = useState<ByokConfig>({
    openaiKey: null,
    geminiKey: null,
    preferredProvider: "auto",
  });
  const [hasKey, setHasKey] = useState(false);

  // Load BYOK config on mount
  useEffect(() => {
    setByokConfig(getByokConfig());
    setHasKey(hasByokKey());
  }, []);

  // Refresh BYOK config when keys change
  const handleKeyChange = useCallback(() => {
    setByokConfig(getByokConfig());
    setHasKey(hasByokKey());
  }, []);

  // Handle preferred provider change
  const handleProviderChange = useCallback((value: string) => {
    const provider = value as PreferredProvider;
    setPreferredProvider(provider);
    setByokConfig((prev) => ({ ...prev, preferredProvider: provider }));
  }, []);

  return (
    <div className="space-y-10">
      {/* Language Section */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/10 flex items-center justify-center">
            <Globe className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">
              {t("settings.language.title")}
            </h2>
            <p className="text-sm text-white/50">
              {t("settings.language.description")}
            </p>
          </div>
        </div>

        <Select value={locale} onValueChange={(v) => setLocale(v as Locale)}>
          <SelectTrigger className="w-full max-w-xs bg-white/5 border-white/10 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SUPPORTED_LOCALES.map((loc) => (
              <SelectItem key={loc} value={loc}>
                {LOCALE_LABELS[loc]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </section>

      {/* API Keys Section */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-violet-500/10 flex items-center justify-center">
            <Key className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">
              {t("settings.apiKeys.title")}
            </h2>
            <p className="text-sm text-white/50">
              {t("settings.apiKeys.description")}
            </p>
          </div>
        </div>

        {/* Discount badge */}
        {hasKey && (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
            <Sparkles className="w-4 h-4" />
            {t("settings.apiKeys.discount")}
          </div>
        )}

        {/* API Key inputs */}
        <div className="space-y-6 pl-0 sm:pl-13">
          <ApiKeyInput
            provider="gemini"
            currentKey={byokConfig.geminiKey}
            onKeyChange={handleKeyChange}
          />

          <ApiKeyInput
            provider="openai"
            currentKey={byokConfig.openaiKey}
            onKeyChange={handleKeyChange}
          />

          {/* Preferred provider selector (only show if at least one key exists) */}
          {hasKey && (
            <div className="space-y-2 pt-4 border-t border-white/10">
              <Label className="text-white">
                {t("settings.apiKeys.preferredProvider")}
              </Label>
              <Select
                value={byokConfig.preferredProvider}
                onValueChange={handleProviderChange}
              >
                <SelectTrigger className="w-full max-w-xs bg-white/5 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">
                    {t("settings.apiKeys.auto")}
                  </SelectItem>
                  {byokConfig.geminiKey && (
                    <SelectItem value="gemini">Google Gemini</SelectItem>
                  )}
                  {byokConfig.openaiKey && (
                    <SelectItem value="openai">OpenAI</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
