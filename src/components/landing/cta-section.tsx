"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useTranslation } from "@/lib/i18n/context";
import { ArrowRight, Shield } from "lucide-react";
import { fadeUpBlur, scaleIn, viewportSettings, duration } from "./animations";

/**
 * CTA section - final conversion with strong call-to-action.
 *
 * Uses culturally-optimized copy:
 * - en-US: Hormozi style (urgency + risk reversal)
 * - pt-BR: Ladeira style (invitation + belonging)
 */
export function CTASection() {
  const { t } = useTranslation();

  return (
    <section className="relative py-24 sm:py-32 px-4 sm:px-6 overflow-hidden">
      {/* Background with gradient and glow */}
      <div className="absolute inset-0 bg-gradient-to-t from-purple-950/30 via-black to-black" />

      {/* Central glow effect */}
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-purple-600/20 rounded-full blur-[150px]"
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <div className="relative z-10 max-w-4xl mx-auto text-center">
        {/* Main CTA content */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportSettings}
        >
          <motion.h2
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white"
            variants={fadeUpBlur}
          >
            {t("landing.cta.title")}
          </motion.h2>

          <motion.p
            className="mt-6 text-lg sm:text-xl text-white/70 max-w-2xl mx-auto leading-relaxed"
            variants={fadeUpBlur}
          >
            {t("landing.cta.subtitle")}
          </motion.p>

          {/* CTA Button */}
          <motion.div className="mt-10" variants={scaleIn}>
            <Link href="/demo" className="inline-block">
              <motion.span
                className="group inline-flex items-center gap-3 px-8 py-4 rounded-full bg-gradient-to-r from-purple-600 to-violet-600 text-white text-lg font-semibold shadow-2xl shadow-purple-500/30"
                whileHover={{
                  scale: 1.02,
                  boxShadow: "0 30px 60px -15px rgba(147, 51, 234, 0.5)",
                }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: duration.instant }}
              >
                {t("landing.cta.button")}
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </motion.span>
            </Link>
          </motion.div>

          {/* Trust indicators */}
          <motion.div
            className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 text-white/50"
            variants={fadeUpBlur}
          >
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span className="text-sm">{t("landing.cta.guarantee")}</span>
            </div>
          </motion.div>

          {/* Social proof footer */}
          <motion.p
            className="mt-12 text-white/40 text-sm"
            variants={fadeUpBlur}
          >
            {t("landing.cta.footer")}
          </motion.p>
        </motion.div>
      </div>

      {/* Footer */}
      <div className="relative z-10 mt-24 pt-8 border-t border-white/10">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-white/40">
          <p>&copy; {new Date().getFullYear()} {t("landing.footer.copyright")}</p>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="hover:text-white/60 transition-colors">
              {t("landing.footer.privacy")}
            </Link>
            <Link href="/terms" className="hover:text-white/60 transition-colors">
              {t("landing.footer.terms")}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
