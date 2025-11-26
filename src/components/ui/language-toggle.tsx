"use client";

import { useI18n } from "@/lib/i18n/context";
import type { Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface LanguageToggleProps {
  className?: string;
}

/**
 * Visual toggle for switching between English and Portuguese.
 * Uses a pill-style design with animated indicator.
 */
export function LanguageToggle({ className }: LanguageToggleProps) {
  const { locale, setLocale } = useI18n();

  const options: { value: Locale; label: string }[] = [
    { value: "en-US", label: "EN" },
    { value: "pt-BR", label: "PT" },
  ];

  return (
    <div
      className={cn(
        "relative flex items-center rounded-full bg-white/5 p-1 border border-white/10",
        className
      )}
      role="radiogroup"
      aria-label="Select language"
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={locale === option.value}
          onClick={() => setLocale(option.value)}
          className={cn(
            "relative z-10 px-3 py-1.5 text-sm font-medium transition-colors duration-200",
            locale === option.value
              ? "text-white"
              : "text-white/60 hover:text-white/80"
          )}
        >
          {option.label}
        </button>
      ))}
      {/* Animated background indicator */}
      <motion.div
        className="absolute top-1 bottom-1 rounded-full bg-white/15"
        initial={false}
        animate={{
          left: locale === "en-US" ? "4px" : "calc(50%)",
          width: "calc(50% - 4px)",
        }}
        transition={{
          type: "spring",
          stiffness: 500,
          damping: 35,
        }}
      />
    </div>
  );
}
