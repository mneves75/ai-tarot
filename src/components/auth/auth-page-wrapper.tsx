"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { PageContainer } from "@/components/ui/page-container";
import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardDescription, GlassCardContent } from "@/components/ui/glass-card";
import { AnimatedSection } from "@/components/ui/animated-section";
import { useTranslation } from "@/lib/i18n/context";
import { WELCOME_CREDITS } from "@/lib/config/constants";

/**
 * Auth Page Wrapper
 *
 * Provides consistent layout and styling for authentication pages
 * (login, signup) with glass morphism design and i18n support.
 *
 * @module components/auth/auth-page-wrapper
 */

interface AuthPageWrapperProps {
  children: ReactNode;
  type: "login" | "signup";
}

export function AuthPageWrapper({ children, type }: AuthPageWrapperProps) {
  const { t } = useTranslation();

  const isLogin = type === "login";
  const title = isLogin ? t("auth.loginTitle") : t("auth.signupTitle");
  const subtitle = isLogin
    ? t("auth.loginSubtitle")
    : t("auth.signupSubtitle").replace("{credits}", String(WELCOME_CREDITS));

  return (
    <PageContainer showOrbs centered>
      <div className="min-h-screen flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md space-y-8">
          {/* Logo and Title */}
          <AnimatedSection variant="fadeUpBlur">
            <div className="text-center">
              <Link href="/" className="inline-flex items-center gap-2 mb-4">
                <motion.div
                  className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500/30 to-violet-500/20 border border-purple-500/20"
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Sparkles className="w-7 h-7 text-purple-300" />
                </motion.div>
                <span className="text-2xl font-bold text-white">
                  {t("meta.appName")}
                </span>
              </Link>
              <p className="text-white/60">{t("meta.tagline")}</p>
            </div>
          </AnimatedSection>

          {/* Auth Card */}
          <AnimatedSection variant="slideUp" delay={0.1}>
            <GlassCard intensity="medium" padding="none">
              <GlassCardHeader className="px-6 pt-6 pb-0">
                <GlassCardTitle as="h1" className="text-xl text-center">
                  {title}
                </GlassCardTitle>
                <GlassCardDescription className="text-center mt-1">
                  {subtitle}
                </GlassCardDescription>
              </GlassCardHeader>
              <GlassCardContent className="px-6 py-6">
                {children}
              </GlassCardContent>
            </GlassCard>
          </AnimatedSection>

          {/* Back to Home */}
          <AnimatedSection variant="fadeIn" delay={0.2}>
            <p className="text-center text-white/40 text-sm">
              <Link
                href="/"
                className="hover:text-white/70 transition-colors"
              >
                {t("common.back")} &rarr; {t("nav.home")}
              </Link>
            </p>
          </AnimatedSection>
        </div>
      </div>
    </PageContainer>
  );
}
