"use client";

import { motion } from "framer-motion";
import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardContent } from "@/components/ui/glass-card";
import { AnimatedList, AnimatedListItem } from "@/components/ui/animated-section";
import { useTranslation } from "@/lib/i18n/context";
import type { CreateReadingSuccessResult } from "@/app/actions/reading";

/**
 * Component to display tarot reading results.
 *
 * Features:
 * - Glass morphism card design
 * - Staggered card reveal animations
 * - Full i18n support
 * - Responsive grid layout
 * - Premium card visual design
 *
 * @module components/reading/reading-results
 */

// ============================================================
// TYPES
// ============================================================

interface ReadingResultsProps {
  result: CreateReadingSuccessResult["data"];
}

// ============================================================
// COMPONENT
// ============================================================

export function ReadingResults({ result }: ReadingResultsProps) {
  const { t } = useTranslation();

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      {/* Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <GlassCard
          intensity="medium"
          padding="lg"
          className="border-purple-500/20 bg-gradient-to-br from-purple-500/10 to-violet-500/5"
        >
          <GlassCardHeader className="pb-3 border-0">
            <GlassCardTitle as="h2" className="text-xl text-purple-200">
              {t("reading.summary")}
            </GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent>
            <p className="text-lg text-purple-100/90 leading-relaxed">
              {result.summary}
            </p>
          </GlassCardContent>
        </GlassCard>
      </motion.div>

      {/* Cards Grid */}
      <div className="space-y-4">
        <motion.h2
          className="text-xl font-semibold text-center text-white"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {t("reading.theCards")}
        </motion.h2>

        <AnimatedList
          className={`grid gap-6 ${
            result.cards.length === 1
              ? "grid-cols-1 max-w-sm mx-auto"
              : result.cards.length === 3
                ? "grid-cols-1 md:grid-cols-3"
                : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-5"
          }`}
          staggerDelay={0.15}
        >
          {result.cards.map((card, index) => (
            <AnimatedListItem key={`${card.code}-${index}`}>
              <TarotCardDisplay
                card={card}
                interpretation={result.perCard[index]}
              />
            </AnimatedListItem>
          ))}
        </AnimatedList>
      </div>

      {/* Overall Message */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <GlassCard
          intensity="medium"
          padding="lg"
          className="border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-orange-500/5"
        >
          <GlassCardHeader className="pb-3 border-0">
            <GlassCardTitle as="h2" className="text-xl text-amber-200">
              {t("reading.overallMessage")}
            </GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent>
            <p className="text-amber-100/90 whitespace-pre-line leading-relaxed">
              {result.overallMessage}
            </p>
          </GlassCardContent>
        </GlassCard>
      </motion.div>

      {/* Safety Reminder */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.5 }}
      >
        <GlassCard intensity="light" padding="md">
          <p className="text-sm text-white/50 text-center italic">
            {result.safetyReminder}
          </p>
        </GlassCard>
      </motion.div>

      {/* Metadata */}
      <motion.div
        className="text-center text-xs text-white/30 space-y-1"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        <p>{t("reading.model")}: {result.model}</p>
        <p>{t("reading.latency")}: {result.latencyMs}ms</p>
      </motion.div>
    </div>
  );
}

// ============================================================
// SUB-COMPONENTS
// ============================================================

interface TarotCardDisplayProps {
  card: CreateReadingSuccessResult["data"]["cards"][number];
  interpretation: CreateReadingSuccessResult["data"]["perCard"][number] | undefined;
}

/**
 * Individual tarot card display with premium glass design.
 */
function TarotCardDisplay({ card, interpretation }: TarotCardDisplayProps) {
  const { t } = useTranslation();
  const isReversed = card.orientation === "reversed";

  return (
    <GlassCard
      intensity="medium"
      padding="none"
      className="overflow-hidden h-full"
      hoverable
    >
      {/* Position Role */}
      <div className="px-4 pt-4 pb-2 text-center">
        <span className="text-xs uppercase tracking-wider text-purple-300/70">
          {card.positionRole}
        </span>
      </div>

      {/* Card Name */}
      <div className="px-4 pb-3 text-center">
        <h3 className="text-lg font-semibold text-white">
          {card.name}
          {isReversed && (
            <span className="ml-2 text-sm font-normal text-white/50">
              ({t("reading.reversed")})
            </span>
          )}
        </h3>
      </div>

      {/* Card Visual */}
      <div className="px-4">
        <motion.div
          className={`aspect-[2/3] rounded-lg overflow-hidden relative ${
            isReversed ? "rotate-180" : ""
          }`}
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.2 }}
        >
          {/* Premium glass card background */}
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 via-purple-500/15 to-violet-500/20 backdrop-blur-sm" />

          {/* Decorative border */}
          <div className="absolute inset-0 border-2 border-white/10 rounded-lg" />

          {/* Inner glow effect */}
          <div className="absolute inset-2 border border-white/5 rounded-md" />

          {/* Card content */}
          <div className={`absolute inset-0 flex flex-col items-center justify-center ${
            isReversed ? "rotate-180" : ""
          }`}>
            {/* Arcana symbol */}
            <div className="text-5xl mb-2 opacity-80">
              {getCardSymbol(card.code)}
            </div>

            {/* Card code */}
            <span className="text-xs text-white/40 font-mono">
              {card.code}
            </span>
          </div>

          {/* Subtle shimmer effect */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-500" />
        </motion.div>
      </div>

      {/* Keywords */}
      <div className="px-4 py-3">
        <div className="flex flex-wrap gap-1 justify-center">
          {card.keywords.slice(0, 3).map((keyword) => (
            <span
              key={keyword}
              className="px-2 py-0.5 text-xs rounded-full bg-purple-500/20 text-purple-200 border border-purple-500/20"
            >
              {keyword}
            </span>
          ))}
        </div>
      </div>

      {/* Interpretation */}
      {interpretation && (
        <div className="px-4 pb-4 pt-2 border-t border-white/10 space-y-2">
          <p className="text-sm text-white/80 leading-relaxed">
            {interpretation.interpretation}
          </p>
          {interpretation.advice && (
            <p className="text-sm italic text-white/50">
              {interpretation.advice}
            </p>
          )}
        </div>
      )}
    </GlassCard>
  );
}

// ============================================================
// UTILITIES
// ============================================================

/**
 * Get a symbolic representation for a tarot card.
 * Uses elegant Unicode symbols instead of emojis for premium feel.
 */
function getCardSymbol(code: string): string {
  // Major Arcana symbols
  const majorArcana: Record<string, string> = {
    "major-00": "0",      // The Fool
    "major-01": "I",      // The Magician
    "major-02": "II",     // The High Priestess
    "major-03": "III",    // The Empress
    "major-04": "IV",     // The Emperor
    "major-05": "V",      // The Hierophant
    "major-06": "VI",     // The Lovers
    "major-07": "VII",    // The Chariot
    "major-08": "VIII",   // Strength
    "major-09": "IX",     // The Hermit
    "major-10": "X",      // Wheel of Fortune
    "major-11": "XI",     // Justice
    "major-12": "XII",    // The Hanged Man
    "major-13": "XIII",   // Death
    "major-14": "XIV",    // Temperance
    "major-15": "XV",     // The Devil
    "major-16": "XVI",    // The Tower
    "major-17": "XVII",   // The Star
    "major-18": "XVIII",  // The Moon
    "major-19": "XIX",    // The Sun
    "major-20": "XX",     // Judgement
    "major-21": "XXI",    // The World
  };

  // Suit symbols (elegant Unicode)
  const suitSymbols: Record<string, string> = {
    wands: "\u2660",     // Spade (representing fire/wands)
    cups: "\u2665",      // Heart (representing water/cups)
    swords: "\u2666",    // Diamond (representing air/swords)
    pentacles: "\u2663", // Club (representing earth/pentacles)
  };

  if (code.startsWith("major-")) {
    return majorArcana[code] ?? "\u2728";
  }

  const parts = code.split("-");
  const suit = parts[0];
  const value = parts[1];

  // Get suit symbol
  const symbol = suit ? suitSymbols[suit] ?? "\u2605" : "\u2605";

  // Format: value + suit symbol
  return value ? `${value.toUpperCase()}${symbol}` : symbol;
}
