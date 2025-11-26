"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useTranslation } from "@/lib/i18n/context";
import { ChevronDown } from "lucide-react";
import {
  fadeUpBlur,
  fadeIn,
  scaleIn,
  staggerContainer,
  duration,
  ease,
} from "./animations";

/**
 * Hero section - the main above-the-fold content.
 *
 * Features:
 * - Animated gradient background
 * - Blur-to-clear text reveal
 * - Floating tarot card decorations
 * - Scroll hint indicator
 */
export function HeroSection() {
  const { t } = useTranslation();

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-purple-950/20 to-black" />

      {/* Animated gradient orbs */}
      <motion.div
        className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/30 rounded-full blur-[128px]"
        animate={{
          x: [0, 50, 0],
          y: [0, 30, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-600/20 rounded-full blur-[128px]"
        animate={{
          x: [0, -30, 0],
          y: [0, -50, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Content */}
      <motion.div
        className="relative z-10 max-w-4xl mx-auto text-center"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        {/* Headline */}
        <motion.h1
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight tracking-tight"
          variants={fadeUpBlur}
        >
          {t("landing.hero.headline")}
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          className="mt-6 text-lg sm:text-xl text-white/70 max-w-2xl mx-auto leading-relaxed"
          variants={fadeUpBlur}
        >
          {t("landing.hero.subheadline")}
        </motion.p>

        {/* CTA Button */}
        <motion.div className="mt-10" variants={scaleIn}>
          <Link
            href="/demo"
            className="group inline-flex flex-col items-center"
          >
            <motion.span
              className="inline-flex px-8 py-4 rounded-full bg-gradient-to-r from-purple-600 to-violet-600 text-white text-lg font-semibold shadow-2xl shadow-purple-500/30"
              whileHover={{
                scale: 1.02,
                boxShadow: "0 25px 50px -12px rgba(147, 51, 234, 0.4)",
              }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: duration.instant }}
            >
              {t("landing.hero.cta")}
            </motion.span>
            <span className="mt-3 text-sm text-white/50">
              {t("landing.hero.ctaSubtext")}
            </span>
          </Link>
        </motion.div>
      </motion.div>

      {/* Scroll hint */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/40"
        variants={fadeIn}
        initial="hidden"
        animate="visible"
        transition={{ delay: 1.5 }}
      >
        <span className="text-sm">{t("landing.hero.scrollHint")}</span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: ease.inOut,
          }}
        >
          <ChevronDown className="w-5 h-5" />
        </motion.div>
      </motion.div>

      {/* Decorative floating cards - positioned for visual interest */}
      <FloatingCard
        className="absolute top-32 left-[10%] hidden lg:block"
        delay={0.5}
        rotation={-12}
      />
      <FloatingCard
        className="absolute top-48 right-[8%] hidden lg:block"
        delay={0.8}
        rotation={15}
      />
      <FloatingCard
        className="absolute bottom-32 left-[15%] hidden lg:block"
        delay={1.1}
        rotation={-8}
      />
    </section>
  );
}

/**
 * Decorative floating tarot card component.
 */
function FloatingCard({
  className,
  delay,
  rotation,
}: {
  className?: string;
  delay: number;
  rotation: number;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, scale: 0.8, rotate: rotation - 10 }}
      animate={{
        opacity: 0.6,
        scale: 1,
        rotate: rotation,
        y: [0, -10, 0],
      }}
      transition={{
        opacity: { delay, duration: duration.slow },
        scale: { delay, duration: duration.slow },
        rotate: { delay, duration: duration.slow },
        y: {
          delay: delay + 0.5,
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        },
      }}
    >
      <div className="w-16 h-24 rounded-lg bg-gradient-to-br from-purple-500/20 to-violet-500/10 border border-white/10 backdrop-blur-sm shadow-xl" />
    </motion.div>
  );
}
