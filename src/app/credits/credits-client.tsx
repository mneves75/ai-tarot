"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Coins, TrendingUp, ShoppingBag, Plus, Sparkles } from "lucide-react";
import { PageContainer, PageTitle } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardContent } from "@/components/ui/glass-card";
import { AnimatedSection, AnimatedList, AnimatedListItem } from "@/components/ui/animated-section";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n/context";
import type { CreditsOverview } from "@/app/actions/credits";

/**
 * Credits Page Client Component
 *
 * Premium glass morphism design for credits management.
 *
 * @module app/credits/credits-client
 */

interface CreditsPageClientProps {
  overview: CreditsOverview | null;
  error?: string;
}

export function CreditsPageClient({ overview, error }: CreditsPageClientProps) {
  const { t } = useTranslation();

  if (error || !overview) {
    return (
      <PageContainer showOrbs centered>
        <PageHeader title={t("credits.title")} showBack backHref="/" />
        <div className="flex items-center justify-center min-h-[60vh]">
          <GlassCard intensity="medium" padding="lg" className="max-w-md text-center">
            <p className="text-red-400">{error ?? t("errors.generic")}</p>
          </GlassCard>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer showOrbs>
      <PageHeader
        title={t("credits.title")}
        showBack
        backHref="/"
        showLanguageToggle
      />

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Page Title */}
        <AnimatedSection variant="fadeUpBlur">
          <PageTitle
            title={t("credits.title")}
            subtitle={t("credits.balance")}
            centered
          />
        </AnimatedSection>

        {/* Stats Grid */}
        <AnimatedSection variant="slideUp" delay={0.1}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Current Balance */}
            <GlassCard
              intensity="medium"
              padding="lg"
              className="text-center border-purple-500/20 bg-gradient-to-br from-purple-500/10 to-violet-500/5"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <div className="flex justify-center mb-3">
                  <div className="p-3 rounded-xl bg-purple-500/20">
                    <Coins className="w-6 h-6 text-purple-300" />
                  </div>
                </div>
                <p className="text-4xl font-bold text-white mb-1">
                  {overview.balance}
                </p>
                <p className="text-sm text-white/60">{t("credits.balance")}</p>
              </motion.div>
            </GlassCard>

            {/* Total Spent */}
            <GlassCard intensity="light" padding="lg" className="text-center">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <div className="flex justify-center mb-3">
                  <div className="p-3 rounded-xl bg-amber-500/20">
                    <TrendingUp className="w-6 h-6 text-amber-300" />
                  </div>
                </div>
                <p className="text-4xl font-bold text-white mb-1">
                  {overview.totalSpent}
                </p>
                <p className="text-sm text-white/60">{t("credits.reading")}</p>
              </motion.div>
            </GlassCard>

            {/* Total Purchased */}
            <GlassCard intensity="light" padding="lg" className="text-center">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <div className="flex justify-center mb-3">
                  <div className="p-3 rounded-xl bg-green-500/20">
                    <ShoppingBag className="w-6 h-6 text-green-300" />
                  </div>
                </div>
                <p className="text-4xl font-bold text-white mb-1">
                  {overview.totalPurchased}
                </p>
                <p className="text-sm text-white/60">{t("credits.purchase")}</p>
              </motion.div>
            </GlassCard>
          </div>
        </AnimatedSection>

        {/* Action Buttons */}
        <AnimatedSection variant="fadeIn" delay={0.2}>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/buy-credits">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button className="w-full sm:w-auto h-12 px-6 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white font-medium shadow-lg shadow-purple-500/25">
                  <Plus className="w-5 h-5 mr-2" />
                  {t("credits.buyMore")}
                </Button>
              </motion.div>
            </Link>
            <Link href="/demo">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  variant="outline"
                  className="w-full sm:w-auto h-12 px-6 border-purple-500/30 text-purple-300 hover:bg-purple-500/10"
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  {t("reading.newReading")}
                </Button>
              </motion.div>
            </Link>
          </div>
        </AnimatedSection>

        {/* Transaction History */}
        <AnimatedSection variant="slideUp" delay={0.3}>
          <GlassCard intensity="medium" padding="lg">
            <GlassCardHeader>
              <GlassCardTitle>{t("credits.transactionHistory")}</GlassCardTitle>
            </GlassCardHeader>
            <GlassCardContent>
              {overview.recentTransactions.length === 0 ? (
                <p className="text-center text-white/50 py-8">
                  {t("credits.noTransactions")}
                </p>
              ) : (
                <div className="space-y-3">
                  {overview.recentTransactions.map((tx, index) => (
                    <motion.div
                      key={tx.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * index }}
                      className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${
                          tx.delta > 0
                            ? "bg-green-500/20 text-green-300"
                            : "bg-amber-500/20 text-amber-300"
                        }`}>
                          {tx.delta > 0 ? (
                            <Plus className="w-4 h-4" />
                          ) : (
                            <Sparkles className="w-4 h-4" />
                          )}
                        </div>
                        <div>
                          <p className="text-white font-medium">
                            {getTransactionLabel(tx.type, t)}
                          </p>
                          <p className="text-xs text-white/50">
                            {new Date(tx.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <span className={`font-semibold ${
                        tx.delta > 0 ? "text-green-400" : "text-amber-400"
                      }`}>
                        {tx.delta > 0 ? "+" : ""}{tx.delta}
                      </span>
                    </motion.div>
                  ))}
                </div>
              )}
            </GlassCardContent>
          </GlassCard>
        </AnimatedSection>
      </div>
    </PageContainer>
  );
}

// ============================================================
// UTILITIES
// ============================================================

type TransactionType = "purchase" | "bonus" | "reading" | "refund" | "adjustment" | "welcome";

function getTransactionLabel(
  type: string,
  t: (key: string) => string
): string {
  const labels: Record<TransactionType, string> = {
    purchase: t("credits.purchase"),
    bonus: t("credits.bonus"),
    reading: t("credits.reading"),
    refund: t("credits.refund"),
    adjustment: t("credits.adjustment"),
    welcome: t("credits.welcome"),
  };
  return labels[type as TransactionType] ?? type;
}
