"use client";

import { useState, useCallback } from "react";
import { useTranslation } from "@/lib/i18n/context";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  type ByokProvider,
  validateKey,
  saveByokKey,
  removeByokKey,
  maskApiKey,
  getProviderKeyUrl,
} from "@/lib/services/byok";
import {
  Eye,
  EyeOff,
  ExternalLink,
  Check,
  X,
  Loader2,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ApiKeyInputProps {
  provider: ByokProvider;
  currentKey: string | null;
  onKeyChange: () => void;
}

type ValidationState = "idle" | "validating" | "valid" | "invalid";

/**
 * Secure API key input component with validation.
 *
 * Features:
 * - Masked display of saved keys
 * - Show/hide toggle
 * - Key validation with visual feedback
 * - Direct link to get API keys
 */
export function ApiKeyInput({
  provider,
  currentKey,
  onKeyChange,
}: ApiKeyInputProps) {
  const { t } = useTranslation();
  const [inputValue, setInputValue] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [validationState, setValidationState] = useState<ValidationState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const keyUrl = getProviderKeyUrl(provider);
  const placeholder = provider === "openai" ? "sk-..." : "AIza...";

  // Get the correct translation keys
  const titleKey = `settings.apiKeys.${provider}.title`;
  const helpTextKey = `settings.apiKeys.${provider}.helpText`;

  const handleValidate = useCallback(async () => {
    if (!inputValue.trim()) return;

    setValidationState("validating");
    setErrorMessage(null);

    const result = await validateKey(provider, inputValue);

    if (result.valid) {
      setValidationState("valid");
      // Auto-save on successful validation
      saveByokKey(provider, inputValue);
      onKeyChange();
      // Clear input and show masked key
      setInputValue("");
    } else {
      setValidationState("invalid");
      setErrorMessage(result.error ?? t("settings.apiKeys.invalid"));
    }
  }, [inputValue, provider, onKeyChange, t]);

  const handleRemove = useCallback(() => {
    removeByokKey(provider);
    setValidationState("idle");
    setInputValue("");
    onKeyChange();
  }, [provider, onKeyChange]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    // Reset validation state when user types
    if (validationState !== "idle") {
      setValidationState("idle");
      setErrorMessage(null);
    }
  };

  return (
    <div className="space-y-3">
      {/* Label and help link */}
      <div className="flex items-center justify-between">
        <Label htmlFor={`${provider}-key`} className="text-white">
          {t(titleKey)}
        </Label>
        <a
          href={keyUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 transition-colors"
        >
          {t(helpTextKey)}
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {/* Current key display (if saved) */}
      {currentKey && !inputValue && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-white/5 border border-white/10">
          <div className="flex-1 font-mono text-sm text-white/70">
            {showKey ? currentKey : maskApiKey(currentKey)}
          </div>
          <button
            type="button"
            onClick={() => setShowKey(!showKey)}
            className="p-1.5 text-white/50 hover:text-white/70 transition-colors"
            aria-label={showKey ? "Hide key" : "Show key"}
          >
            {showKey ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
          <button
            type="button"
            onClick={handleRemove}
            className="p-1.5 text-red-400/70 hover:text-red-400 transition-colors"
            aria-label="Remove key"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <span className="flex items-center gap-1 text-xs text-emerald-400">
            <Check className="w-3 h-3" />
            {t("settings.apiKeys.valid")}
          </span>
        </div>
      )}

      {/* Input field (for new key or when editing) */}
      {(!currentKey || inputValue) && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                id={`${provider}-key`}
                type={showKey ? "text" : "password"}
                value={inputValue}
                onChange={handleInputChange}
                placeholder={placeholder}
                className={cn(
                  "bg-white/5 border-white/10 text-white placeholder:text-white/30 font-mono pr-10",
                  validationState === "valid" && "border-emerald-500/50",
                  validationState === "invalid" && "border-red-500/50"
                )}
                disabled={validationState === "validating"}
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white/70 transition-colors"
                aria-label={showKey ? "Hide key" : "Show key"}
              >
                {showKey ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>

            <Button
              type="button"
              onClick={handleValidate}
              disabled={!inputValue.trim() || validationState === "validating"}
              variant="outline"
              className="bg-white/5 border-white/10 text-white hover:bg-white/10"
            >
              {validationState === "validating" ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t("settings.apiKeys.validating")}
                </>
              ) : (
                t("settings.apiKeys.validate")
              )}
            </Button>
          </div>

          {/* Validation feedback */}
          {validationState === "valid" && (
            <div className="flex items-center gap-2 text-sm text-emerald-400">
              <Check className="w-4 h-4" />
              {t("settings.apiKeys.saved")}
            </div>
          )}

          {validationState === "invalid" && errorMessage && (
            <div className="flex items-center gap-2 text-sm text-red-400">
              <X className="w-4 h-4" />
              {errorMessage}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
