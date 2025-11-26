"use client";

import { useState, useTransition } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardContent } from "@/components/ui/glass-card";
import { useTranslation } from "@/lib/i18n/context";
import type { Locale } from "@/lib/i18n";
import {
  createReading,
  type CreateReadingInput,
  type CreateReadingResult,
} from "@/app/actions/reading";

/**
 * Reading form component for tarot readings.
 *
 * Features:
 * - Glass morphism card design
 * - Full i18n support
 * - Question input with character counter
 * - Spread type selection with descriptions
 * - Animated loading state
 * - Accessible error display
 *
 * @module components/reading/reading-form
 */

// ============================================================
// TYPES
// ============================================================

interface ReadingFormProps {
  onSuccess: (result: CreateReadingResult & { success: true }) => void;
  onError: (error: { code: string; message: string; field: string | undefined }) => void;
  /** Locale for the reading generation */
  locale?: Locale;
}

// ============================================================
// CONSTANTS
// ============================================================

const MIN_QUESTION_LENGTH = 10;
const MAX_QUESTION_LENGTH = 500;

type SpreadType = "one" | "three" | "five";

// ============================================================
// COMPONENT
// ============================================================

export function ReadingForm({ onSuccess, onError, locale = "pt-BR" }: ReadingFormProps) {
  const { t } = useTranslation();

  const [question, setQuestion] = useState("");
  const [spreadType, setSpreadType] = useState<SpreadType>("three");
  const [isPending, startTransition] = useTransition();
  const [fieldError, setFieldError] = useState<string | null>(null);

  const questionLength = question.trim().length;
  const isQuestionValid =
    questionLength >= MIN_QUESTION_LENGTH && questionLength <= MAX_QUESTION_LENGTH;

  // Build spread options from translations
  const spreadOptions: { value: SpreadType; label: string; description: string }[] = [
    {
      value: "one",
      label: t("reading.oneCard"),
      description: t("reading.oneCardDesc"),
    },
    {
      value: "three",
      label: t("reading.threeCards"),
      description: t("reading.threeCardsDesc"),
    },
    {
      value: "five",
      label: t("reading.fiveCards"),
      description: t("reading.fiveCardsDesc"),
    },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFieldError(null);

    if (!isQuestionValid) {
      const errorMsg =
        questionLength < MIN_QUESTION_LENGTH
          ? t("reading.minChars").replace("{min}", String(MIN_QUESTION_LENGTH))
          : t("reading.maxChars").replace("{max}", String(MAX_QUESTION_LENGTH));
      setFieldError(errorMsg);
      return;
    }

    const input: CreateReadingInput = {
      question: question.trim(),
      spreadType,
      language: locale,
    };

    startTransition(async () => {
      const result = await createReading(input);

      if (result.success) {
        onSuccess(result);
      } else {
        if (result.error.field) {
          setFieldError(result.error.message);
        }
        onError(result.error);
      }
    });
  };

  return (
    <GlassCard
      animated
      intensity="medium"
      padding="none"
      className="w-full max-w-2xl mx-auto overflow-hidden"
    >
      <GlassCardHeader className="px-6 pt-6 pb-4 border-b border-white/10">
        <GlassCardTitle as="h2" className="text-2xl text-center text-white">
          {t("reading.formTitle")}
        </GlassCardTitle>
      </GlassCardHeader>

      <GlassCardContent className="px-6 py-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Question Input */}
          <div className="space-y-2">
            <Label htmlFor="question" className="text-white font-medium">
              {t("reading.question")}
            </Label>
            <Textarea
              id="question"
              placeholder={t("reading.questionPlaceholder")}
              value={question}
              onChange={(e) => {
                setQuestion(e.target.value);
                setFieldError(null);
              }}
              disabled={isPending}
              className="min-h-[120px] resize-none bg-black/30 border-white/20 text-white placeholder:text-white/40 focus:border-purple-400 focus:ring-purple-400/30"
              aria-describedby="question-hint"
              aria-invalid={!!fieldError}
            />
            <div className="flex justify-between text-sm">
              <span id="question-hint" className="text-white/60">
                {fieldError ? (
                  <span className="text-red-400" role="alert">
                    {fieldError}
                  </span>
                ) : (
                  t("reading.formHint")
                )}
              </span>
              <span
                className={
                  questionLength > MAX_QUESTION_LENGTH
                    ? "text-red-400"
                    : questionLength >= MIN_QUESTION_LENGTH
                      ? "text-green-400"
                      : "text-white/40"
                }
              >
                {questionLength}/{MAX_QUESTION_LENGTH}
              </span>
            </div>
          </div>

          {/* Spread Type Select */}
          <div className="space-y-2">
            <Label htmlFor="spread-type" className="text-white font-medium">
              {t("reading.spreadType")}
            </Label>
            <Select
              value={spreadType}
              onValueChange={(value) => setSpreadType(value as SpreadType)}
              disabled={isPending}
            >
              <SelectTrigger
                id="spread-type"
                className="w-full h-auto min-h-[2.5rem] bg-black/30 border-white/20 text-white focus:border-purple-400 focus:ring-purple-400/30"
              >
                <SelectValue placeholder={t("reading.spreadType")}>
                  {/* Show only label in trigger, not description */}
                  {spreadOptions.find((opt) => opt.value === spreadType)?.label}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-gray-900/95 border-white/20 backdrop-blur-xl z-50">
                {spreadOptions.map((option) => (
                  <SelectItem
                    key={option.value}
                    value={option.value}
                    className="text-white focus:bg-purple-500/20 focus:text-white cursor-pointer py-3"
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium">{option.label}</span>
                      <span className="text-xs text-white/50 font-normal">
                        {option.description}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Submit Button */}
          <motion.div
            whileHover={{ scale: isPending ? 1 : 1.01 }}
            whileTap={{ scale: isPending ? 1 : 0.99 }}
          >
            <Button
              type="submit"
              className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white shadow-lg shadow-purple-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
              size="lg"
              disabled={isPending || !isQuestionValid}
              aria-busy={isPending}
            >
              {isPending ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {t("reading.consulting")}
                </span>
              ) : (
                t("reading.startReading")
              )}
            </Button>
          </motion.div>
        </form>
      </GlassCardContent>
    </GlassCard>
  );
}
