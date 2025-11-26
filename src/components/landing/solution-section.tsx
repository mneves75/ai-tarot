"use client";

import { motion } from "framer-motion";
import { useTranslation } from "@/lib/i18n/context";
import { Check } from "lucide-react";
import {
  fadeUpBlur,
  staggerContainer,
  staggerItem,
  viewportSettings,
  duration,
} from "./animations";

/**
 * Solution section - reveals the product as the answer to the problem.
 *
 * Features:
 * - Clear value proposition
 * - Key benefits checklist
 * - Visual product representation
 */
export function SolutionSection() {
  const { t, translations } = useTranslation();

  // Access the features array directly from translations
  const features = translations.landing?.solution?.features ?? [];

  return (
    <section className="relative py-24 sm:py-32 px-4 sm:px-6 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-purple-950/20 to-black" />

      {/* Decorative glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-purple-600/10 rounded-full blur-[150px] pointer-events-none" />

      <div className="relative z-10 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Text content */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={viewportSettings}
          >
            <motion.h2
              className="text-3xl sm:text-4xl md:text-5xl font-bold text-white"
              variants={fadeUpBlur}
            >
              {t("landing.solution.title")}
            </motion.h2>

            <motion.p
              className="mt-4 text-xl text-purple-300"
              variants={fadeUpBlur}
            >
              {t("landing.solution.subtitle")}
            </motion.p>

            <motion.p
              className="mt-6 text-lg text-white/70 leading-relaxed"
              variants={fadeUpBlur}
            >
              {t("landing.solution.description")}
            </motion.p>

            {/* Feature checklist */}
            <motion.ul className="mt-8 space-y-4" variants={staggerContainer}>
              {features.map((feature) => (
                <motion.li
                  key={feature}
                  className="flex items-start gap-3"
                  variants={staggerItem}
                >
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-violet-500 flex items-center justify-center mt-0.5">
                    <Check className="w-4 h-4 text-white" />
                  </span>
                  <span className="text-white/80">{feature}</span>
                </motion.li>
              ))}
            </motion.ul>
          </motion.div>

          {/* Visual product representation */}
          <motion.div
            className="relative"
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={viewportSettings}
            transition={{ duration: duration.slow, delay: 0.2 }}
          >
            {/* Product mockup - glass card stack */}
            <div className="relative aspect-square max-w-md mx-auto">
              {/* Background glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-violet-500/10 rounded-3xl blur-2xl" />

              {/* Stacked cards effect */}
              <motion.div
                className="absolute inset-4 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl"
                style={{ transform: "rotate(-6deg)" }}
                animate={{ rotate: [-6, -4, -6] }}
                transition={{ duration: 6, repeat: Infinity }}
              />
              <motion.div
                className="absolute inset-4 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-xl"
                style={{ transform: "rotate(3deg)" }}
                animate={{ rotate: [3, 5, 3] }}
                transition={{ duration: 5, repeat: Infinity }}
              />

              {/* Main card */}
              <motion.div
                className="relative h-full rounded-2xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/10 backdrop-blur-xl p-8 flex flex-col items-center justify-center"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: duration.quick }}
              >
                {/* Tarot card icon */}
                <div className="w-24 h-36 rounded-xl bg-gradient-to-br from-purple-500/30 to-violet-500/20 border border-white/20 flex items-center justify-center mb-6">
                  <span className="text-4xl">&#10024;</span>
                </div>

                {/* Mock interpretation preview */}
                <div className="w-full space-y-3">
                  <div className="h-3 bg-white/10 rounded-full w-3/4 mx-auto" />
                  <div className="h-3 bg-white/10 rounded-full w-full" />
                  <div className="h-3 bg-white/10 rounded-full w-5/6 mx-auto" />
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
