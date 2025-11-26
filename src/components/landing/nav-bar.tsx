"use client";

import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { useTranslation } from "@/lib/i18n/context";
import { LanguageToggle } from "@/components/ui/language-toggle";
import { Settings } from "lucide-react";

/**
 * Sticky navigation bar for the landing page.
 *
 * Features:
 * - Glass morphism effect that intensifies on scroll
 * - Language toggle
 * - Settings link
 * - CTA button
 */
export function NavBar() {
  const { t } = useTranslation();
  const { scrollY } = useScroll();

  // Intensify background as user scrolls
  const backgroundOpacity = useTransform(scrollY, [0, 100], [0, 0.8]);
  const borderOpacity = useTransform(scrollY, [0, 100], [0, 0.1]);
  const backdropBlur = useTransform(scrollY, [0, 100], [0, 12]);

  return (
    <motion.nav
      className="fixed top-0 left-0 right-0 z-40 px-4 sm:px-6 py-4"
      style={{
        backgroundColor: useTransform(
          backgroundOpacity,
          (v) => `rgba(0, 0, 0, ${v})`
        ),
        borderBottom: useTransform(
          borderOpacity,
          (v) => `1px solid rgba(255, 255, 255, ${v})`
        ),
        backdropFilter: useTransform(backdropBlur, (v) => `blur(${v}px)`),
      }}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link
          href="/"
          className="text-xl font-semibold text-white hover:text-white/90 transition-colors"
        >
          AI Mystic Tarot
        </Link>

        {/* Actions */}
        <div className="flex items-center gap-2 sm:gap-4">
          <LanguageToggle />

          <Link
            href="/settings"
            className="p-2 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            aria-label={t("landing.nav.settings")}
          >
            <Settings className="w-5 h-5" />
          </Link>

          <Link
            href="/demo"
            className="hidden sm:inline-flex px-4 py-2 rounded-full bg-gradient-to-r from-purple-600 to-violet-600 text-white text-sm font-medium hover:from-purple-500 hover:to-violet-500 transition-all shadow-lg shadow-purple-500/25"
          >
            {t("landing.nav.tryFree")}
          </Link>
        </div>
      </div>
    </motion.nav>
  );
}
