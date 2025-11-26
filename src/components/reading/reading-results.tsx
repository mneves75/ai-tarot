"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Sparkles, MessageCircle, Info } from "lucide-react";
import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardContent } from "@/components/ui/glass-card";
import { AnimatedList, AnimatedListItem } from "@/components/ui/animated-section";
import { useTranslation } from "@/lib/i18n/context";
import type { CreateReadingSuccessResult } from "@/app/actions/reading";

/**
 * Reading Results Component
 *
 * Displays tarot reading results with:
 * - Actual card images from /public/cards/
 * - Clean dark backgrounds for legibility
 * - High contrast text (WCAG AA compliant)
 * - Responsive grid layout
 * - Staggered animations
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
// MAIN COMPONENT
// ============================================================

export function ReadingResults({ result }: ReadingResultsProps) {
  const { t } = useTranslation();

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      {/* Summary Section */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        aria-labelledby="summary-heading"
      >
        <div className="bg-gray-900/80 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-purple-500/20">
              <Sparkles className="w-5 h-5 text-purple-400" />
            </div>
            <h2 id="summary-heading" className="text-xl font-semibold text-white">
              {t("reading.summary")}
            </h2>
          </div>
          <p className="text-lg text-white/90 leading-relaxed">
            {result.summary}
          </p>
        </div>
      </motion.section>

      {/* Cards Section */}
      <section aria-labelledby="cards-heading">
        <motion.h2
          id="cards-heading"
          className="text-xl font-semibold text-center text-white mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {t("reading.theCards")}
        </motion.h2>

        <AnimatedList
          className={`grid gap-6 ${getGridClasses(result.cards.length)}`}
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
      </section>

      {/* Overall Message Section */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        aria-labelledby="message-heading"
      >
        <div className="bg-gray-900/80 border border-amber-500/20 rounded-2xl p-6 backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-amber-500/20">
              <MessageCircle className="w-5 h-5 text-amber-400" />
            </div>
            <h2 id="message-heading" className="text-xl font-semibold text-white">
              {t("reading.overallMessage")}
            </h2>
          </div>
          <p className="text-white/90 whitespace-pre-line leading-relaxed">
            {result.overallMessage}
          </p>
        </div>
      </motion.section>

      {/* Safety Reminder */}
      <motion.aside
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.5 }}
        className="bg-gray-900/50 border border-white/5 rounded-xl p-4"
        role="note"
        aria-label="Safety reminder"
      >
        <div className="flex items-start gap-3">
          <Info className="w-4 h-4 text-white/40 mt-0.5 shrink-0" />
          <p className="text-sm text-white/50 italic">
            {result.safetyReminder}
          </p>
        </div>
      </motion.aside>

      {/* Metadata */}
      <motion.footer
        className="text-center text-xs text-white/40 space-y-1"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        <p>{t("reading.model")}: {result.model}</p>
        <p>{t("reading.latency")}: {result.latencyMs}ms</p>
      </motion.footer>
    </div>
  );
}

// ============================================================
// TAROT CARD DISPLAY
// ============================================================

interface TarotCardDisplayProps {
  card: CreateReadingSuccessResult["data"]["cards"][number];
  interpretation: CreateReadingSuccessResult["data"]["perCard"][number] | undefined;
}

/**
 * Individual tarot card display with:
 * - Actual card image (if available)
 * - Clean dark background for legibility
 * - High contrast text
 * - Responsive design
 */
function TarotCardDisplay({ card, interpretation }: TarotCardDisplayProps) {
  const { t } = useTranslation();
  const isReversed = card.orientation === "reversed";

  return (
    <article
      className="bg-gray-900/90 border border-white/10 rounded-2xl overflow-hidden h-full flex flex-col"
      aria-label={`${card.name} - ${card.positionRole}`}
    >
      {/* Position Role Header */}
      <header className="px-4 pt-4 pb-2 text-center border-b border-white/5">
        <span className="text-xs uppercase tracking-wider font-medium text-purple-400">
          {card.positionRole}
        </span>
      </header>

      {/* Card Name */}
      <div className="px-4 py-3 text-center">
        <h3 className="text-lg font-semibold text-white">
          {card.name}
          {isReversed && (
            <span className="ml-2 text-sm font-normal text-red-400/80">
              ({t("reading.reversed")})
            </span>
          )}
        </h3>
      </div>

      {/* Card Image */}
      <div className="px-4 pb-4 flex-shrink-0">
        <div
          className={`relative aspect-[2/3] rounded-lg overflow-hidden border border-white/10 bg-gray-800 ${
            isReversed ? "rotate-180" : ""
          }`}
        >
          {card.imageUrl ? (
            <Image
              src={card.imageUrl}
              alt={`${card.name} tarot card`}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 33vw, 20vw"
              priority={false}
            />
          ) : (
            // Fallback for cards without images
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-purple-900/50 to-violet-900/50">
              <span className="text-4xl font-serif text-white/60 mb-2">
                {getCardSymbol(card.code)}
              </span>
              <span className="text-xs text-white/40 font-mono">
                {card.code}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Keywords */}
      <div className="px-4 py-3 border-t border-white/5">
        <div className="flex flex-wrap gap-1.5 justify-center">
          {card.keywords.slice(0, 3).map((keyword) => (
            <span
              key={keyword}
              className="px-2.5 py-1 text-xs font-medium rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/20"
            >
              {keyword}
            </span>
          ))}
        </div>
      </div>

      {/* Interpretation */}
      {interpretation && (
        <div className="px-4 pb-4 pt-3 border-t border-white/5 flex-1 space-y-3">
          <p className="text-sm text-white/85 leading-relaxed">
            {interpretation.interpretation}
          </p>
          {interpretation.advice && (
            <p className="text-sm italic text-purple-300/80 border-l-2 border-purple-500/30 pl-3">
              {interpretation.advice}
            </p>
          )}
        </div>
      )}
    </article>
  );
}

// ============================================================
// UTILITIES
// ============================================================

/**
 * Get responsive grid classes based on number of cards.
 * Optimizes layout for 1, 3, or 5 card spreads.
 */
function getGridClasses(cardCount: number): string {
  switch (cardCount) {
    case 1:
      return "grid-cols-1 max-w-sm mx-auto";
    case 3:
      return "grid-cols-1 md:grid-cols-3";
    case 5:
      return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-5";
    default:
      return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";
  }
}

/**
 * Get Roman numeral or suit symbol for a tarot card.
 * Used as fallback when card image is not available.
 *
 * @param code - Card code (e.g., "major-02", "swords-ace")
 * @returns Symbol string (Roman numeral or suit symbol)
 */
function getCardSymbol(code: string): string {
  // Major Arcana - use Roman numerals
  const majorArcana: Record<string, string> = {
    "major-00": "0",
    "major-01": "I",
    "major-02": "II",
    "major-03": "III",
    "major-04": "IV",
    "major-05": "V",
    "major-06": "VI",
    "major-07": "VII",
    "major-08": "VIII",
    "major-09": "IX",
    "major-10": "X",
    "major-11": "XI",
    "major-12": "XII",
    "major-13": "XIII",
    "major-14": "XIV",
    "major-15": "XV",
    "major-16": "XVI",
    "major-17": "XVII",
    "major-18": "XVIII",
    "major-19": "XIX",
    "major-20": "XX",
    "major-21": "XXI",
  };

  if (code.startsWith("major-")) {
    return majorArcana[code] ?? "✧";
  }

  // Minor Arcana - use Unicode suit symbols
  const suitSymbols: Record<string, string> = {
    wands: "♠",
    cups: "♥",
    swords: "♦",
    pentacles: "♣",
  };

  const [suit, value] = code.split("-");
  const symbol = suitSymbols[suit ?? ""] ?? "✧";

  return value ? `${value.toUpperCase()}${symbol}` : symbol;
}
