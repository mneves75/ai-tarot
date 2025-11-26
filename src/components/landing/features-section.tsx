"use client";

import { motion } from "framer-motion";
import { useTranslation } from "@/lib/i18n/context";
import { Sparkles, Layers, Shield } from "lucide-react";
import {
  fadeUpBlur,
  staggerContainer,
  staggerItem,
  viewportSettings,
  cardHover,
} from "./animations";

// Icon mapping for features
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  sparkles: Sparkles,
  layers: Layers,
  shield: Shield,
};

/**
 * Features section - highlights key benefits of the product.
 *
 * Features:
 * - Three key benefit cards
 * - Animated icons
 * - Glass morphism design
 */
export function FeaturesSection() {
  const { t, translations } = useTranslation();

  // Access the items array directly from translations
  const items = translations.landing?.features?.items ?? [];

  return (
    <section className="relative py-24 sm:py-32 px-4 sm:px-6 bg-black">
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
            {t("landing.features.title")}
          </h2>
          <p className="mt-4 text-lg text-white/60 max-w-2xl mx-auto">
            {t("landing.features.subtitle")}
          </p>
        </motion.div>

        {/* Feature cards */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={viewportSettings}
        >
          {items.map((item) => {
            const Icon = iconMap[item.icon] ?? Sparkles;
            return (
              <motion.div
                key={item.title}
                className="group relative p-8 rounded-2xl bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/[0.06] backdrop-blur-sm overflow-hidden"
                variants={staggerItem}
                whileHover={cardHover}
              >
                {/* Gradient background on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-violet-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                {/* Content */}
                <div className="relative z-10">
                  {/* Icon with animated background */}
                  <motion.div
                    className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500/20 to-violet-500/10 border border-purple-500/20 flex items-center justify-center mb-6"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  >
                    <Icon className="w-7 h-7 text-purple-400" />
                  </motion.div>

                  {/* Text */}
                  <h3 className="text-xl font-semibold text-white mb-3">
                    {item.title}
                  </h3>
                  <p className="text-white/60 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                {/* Corner decoration */}
                <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-gradient-to-br from-purple-500/10 to-transparent rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
