"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { useTranslation } from "@/lib/i18n/context";
import { Check, Sparkles } from "lucide-react";
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
 * Mercury/Vercel-style design with:
 * - Clear value proposition
 * - Key benefits checklist
 * - Actual tarot card visual
 */
export function SolutionSection() {
  const { t, translations } = useTranslation();

  // Access the features array directly from translations
  const features = translations.landing?.solution?.features ?? [];

  return (
    <section className="relative py-24 sm:py-32 px-4 sm:px-6 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-purple-950/10 to-black" />

      {/* Decorative glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-600/8 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Text content */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={viewportSettings}
          >
            <motion.h2
              className="text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight"
              variants={fadeUpBlur}
            >
              {t("landing.solution.title")}
            </motion.h2>

            <motion.p
              className="mt-4 text-xl text-purple-300/90 font-medium"
              variants={fadeUpBlur}
            >
              {t("landing.solution.subtitle")}
            </motion.p>

            <motion.p
              className="mt-6 text-lg text-white/60 leading-relaxed"
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
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center mt-0.5">
                    <Check className="w-3 h-3 text-purple-400" />
                  </span>
                  <span className="text-white/70">{feature}</span>
                </motion.li>
              ))}
            </motion.ul>
          </motion.div>

          {/* Visual - Actual Tarot Card Display */}
          <motion.div
            className="relative"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewportSettings}
            transition={{ duration: duration.slow, delay: 0.2 }}
          >
            <div className="relative max-w-sm mx-auto">
              {/* Glow effect behind card */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/30 to-violet-500/20 rounded-3xl blur-3xl scale-110" />

              {/* Background decorative cards */}
              <motion.div
                className="absolute -left-8 top-8 w-32 h-48 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-sm"
                style={{ transform: "rotate(-15deg)" }}
                animate={{ rotate: [-15, -12, -15], y: [0, -5, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.div
                className="absolute -right-8 top-12 w-32 h-48 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-sm"
                style={{ transform: "rotate(12deg)" }}
                animate={{ rotate: [12, 15, 12], y: [0, -8, 0] }}
                transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
              />

              {/* Main card container */}
              <motion.div
                className="relative z-10 rounded-2xl bg-gradient-to-br from-gray-900/90 to-gray-900/70 border border-white/10 backdrop-blur-xl p-6 shadow-2xl"
                whileHover={{ scale: 1.02, y: -5 }}
                transition={{ duration: 0.3 }}
              >
                {/* Card image */}
                <div className="relative aspect-[4/7] rounded-xl overflow-hidden border border-white/10 mb-4">
                  <Image
                    src="/cards/major_17_the_star.png"
                    alt="The Star Tarot Card"
                    fill
                    className="object-contain"
                    sizes="(max-width: 768px) 100vw, 300px"
                  />
                </div>

                {/* Card info */}
                <div className="text-center space-y-2">
                  <h3 className="text-lg font-semibold text-white">A Estrela</h3>
                  <div className="flex items-center justify-center gap-2 text-purple-400 text-sm">
                    <Sparkles className="w-4 h-4" />
                    <span>Esperança • Inspiração • Serenidade</span>
                  </div>
                </div>

                {/* Decorative corner accent */}
                <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-purple-400/60" />
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
