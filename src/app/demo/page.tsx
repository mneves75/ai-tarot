"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, Sparkles } from "lucide-react";
import { ReadingForm, ReadingResults } from "@/components/reading";
import { Button } from "@/components/ui/button";
import { PageContainer, PageTitle } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { GlassCard } from "@/components/ui/glass-card";
import { AnimatedSection } from "@/components/ui/animated-section";
import { useTranslation } from "@/lib/i18n/context";
import type { CreateReadingSuccessResult } from "@/app/actions/reading";

/**
 * Demo Tarot Reading Page
 *
 * Premium glass morphism design with full i18n support.
 * Allows users to experience tarot readings without authentication.
 *
 * Features:
 * - Animated entrance and transitions
 * - Glass morphism card design
 * - Full bilingual support (en-US/pt-BR)
 * - Responsive layout
 * - Accessible error handling with ARIA live regions
 */
export default function DemoReadingPage() {
  const { t, locale } = useTranslation();

  const [readingResult, setReadingResult] = useState<
    CreateReadingSuccessResult["data"] | null
  >(null);
  const [error, setError] = useState<{
    code: string;
    message: string;
    field: string | undefined;
  } | null>(null);

  const handleSuccess = useCallback(
    (result: CreateReadingSuccessResult) => {
      setReadingResult(result.data);
      setError(null);
    },
    []
  );

  const handleError = useCallback(
    (err: { code: string; message: string; field: string | undefined }) => {
      setError(err);
    },
    []
  );

  const handleNewReading = useCallback(() => {
    setReadingResult(null);
    setError(null);
  }, []);

  return (
    <PageContainer showOrbs maxWidth="4xl" padding="none">
      {/* Sticky glass header */}
      <PageHeader
        title="AI Tarot"
        showLanguageToggle
        showSettings
        maxWidth="4xl"
        actions={
          <span className="text-sm text-amber-400/80 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20">
            {t("demo.badge")}
          </span>
        }
      />

      {/* Main Content */}
      <main className="px-4 sm:px-6 py-8 sm:py-12">
        {/* Error Alert - uses ARIA live region for accessibility */}
        <AnimatePresence>
          {error && !error.field && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-2xl mx-auto mb-8"
            >
              <GlassCard
                intensity="medium"
                padding="md"
                className="border-red-500/30 bg-red-500/10"
              >
                <div
                  role="alert"
                  aria-live="assertive"
                  className="flex items-start gap-3"
                >
                  <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-red-300">
                      {t("demo.errorPrefix")}: {error.message}
                    </p>
                    <p className="text-sm text-red-400/70 mt-1">
                      {t("demo.errorCode")}: {error.code}
                    </p>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form or Results - with animated transitions */}
        <AnimatePresence mode="wait">
          {readingResult ? (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-8"
            >
              {/* Question Reminder */}
              <AnimatedSection variant="fadeIn" className="text-center">
                <p className="text-sm text-white/70">{t("demo.yourQuestion")}:</p>
                <p className="text-lg font-medium text-white mt-1">
                  {readingResult.question}
                </p>
              </AnimatedSection>

              {/* Results */}
              <ReadingResults result={readingResult} />

              {/* New Reading Button */}
              <AnimatedSection variant="fadeIn" delay={0.3} className="text-center pt-8">
                <Button
                  onClick={handleNewReading}
                  variant="outline"
                  size="lg"
                  className="border-white/20 text-white hover:bg-white/10 hover:border-white/30"
                >
                  {t("reading.newReading")}
                </Button>
              </AnimatedSection>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-8"
            >
              {/* Introduction */}
              <AnimatedSection className="text-center max-w-2xl mx-auto space-y-4">
                <motion.div
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-sm mb-4"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{t("meta.tagline")}</span>
                </motion.div>

                <PageTitle
                  title={t("demo.title")}
                  subtitle={t("demo.subtitle")}
                />
              </AnimatedSection>

              {/* Form */}
              <AnimatedSection delay={0.2}>
                <ReadingForm
                  onSuccess={handleSuccess}
                  onError={handleError}
                  locale={locale}
                />
              </AnimatedSection>

              {/* Disclaimer */}
              <AnimatedSection delay={0.4} className="text-center max-w-xl mx-auto">
                <p className="text-sm text-white/60 leading-relaxed">
                  {t("demo.disclaimer")}
                </p>
              </AnimatedSection>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/15 mt-16 py-6">
        <div className="max-w-4xl mx-auto px-4 text-center text-sm text-white/60">
          <p>{t("demo.footer")} &copy; {new Date().getFullYear()}</p>
        </div>
      </footer>
    </PageContainer>
  );
}
