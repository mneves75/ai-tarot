"use client";

import { motion } from "framer-motion";
import { useTranslation } from "@/lib/i18n/context";
import { Brain, Compass, Sparkles } from "lucide-react";
import {
  fadeUpBlur,
  staggerContainer,
  staggerItem,
  viewportSettings,
} from "./animations";

const icons = [Brain, Compass, Sparkles] as const;

/**
 * Problem section - agitates pain points to build desire for solution.
 *
 * Uses culturally-optimized copy:
 * - en-US: Hormozi style (cost/consequence focus)
 * - pt-BR: Ladeira style (emotional narrative)
 */
export function ProblemSection() {
  const { t, translations } = useTranslation();

  // Access the points array directly from translations
  const points = translations.landing?.problem?.points ?? [];

  return (
    <section className="relative py-24 sm:py-32 px-4 sm:px-6 bg-black">
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-purple-950/10 via-transparent to-transparent" />

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Section header */}
        <motion.div
          className="text-center mb-16"
          variants={fadeUpBlur}
          initial="hidden"
          whileInView="visible"
          viewport={viewportSettings}
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white">
            {t("landing.problem.title")}
          </h2>
          <p className="mt-4 text-lg text-white/60 max-w-2xl mx-auto">
            {t("landing.problem.subtitle")}
          </p>
        </motion.div>

        {/* Problem cards */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={viewportSettings}
        >
          {points.map((point, index) => {
            const Icon = icons[index % icons.length] ?? Brain;
            return (
              <motion.div
                key={point.title}
                className="group relative p-6 sm:p-8 rounded-2xl bg-white/[0.02] border border-white/[0.05] hover:border-white/10 transition-colors"
                variants={staggerItem}
                whileHover={{ y: -4 }}
              >
                {/* Icon */}
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-violet-500/10 flex items-center justify-center mb-6">
                  <Icon className="w-6 h-6 text-purple-400" />
                </div>

                {/* Content */}
                <h3 className="text-xl font-semibold text-white mb-3">
                  {point.title}
                </h3>
                <p className="text-white/60 leading-relaxed">
                  {point.description}
                </p>

                {/* Hover glow effect */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
