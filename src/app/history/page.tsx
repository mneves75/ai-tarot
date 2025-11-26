"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Clock, Sparkles, ArrowLeft, RefreshCw, Loader2 } from "lucide-react";
import { getUserReadingHistory, type HistoryPageData } from "@/app/actions/history";
import { Button } from "@/components/ui/button";
import { PageContainer, PageTitle } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardContent } from "@/components/ui/glass-card";
import { AnimatedSection } from "@/components/ui/animated-section";
import { GlassCardSkeleton } from "@/components/ui/skeleton";

const ITEMS_PER_PAGE = 10;

const SPREAD_LABELS: Record<string, string> = {
  one: "1 Carta",
  three: "3 Cartas",
  five: "5 Cartas",
};

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trim()}...`;
}

export default function HistoryPage() {
  const [data, setData] = useState<HistoryPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadInitial = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getUserReadingHistory(ITEMS_PER_PAGE, 0);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar histórico");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMore = useCallback(async () => {
    if (!data || loadingMore || !data.hasMore) return;

    try {
      setLoadingMore(true);
      const result = await getUserReadingHistory(ITEMS_PER_PAGE, data.readings.length);
      setData((prev) => {
        if (!prev) return result;
        return {
          ...result,
          readings: [...prev.readings, ...result.readings],
        };
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar mais leituras");
    } finally {
      setLoadingMore(false);
    }
  }, [data, loadingMore]);

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  if (loading) {
    return <HistoryPageSkeleton />;
  }

  if (error) {
    return (
      <PageContainer showOrbs maxWidth="4xl">
        <PageHeader title="AI Tarot" showBack backHref="/" />
        <main className="px-4 sm:px-6 py-8 sm:py-12">
          <GlassCard intensity="medium" padding="lg" className="max-w-lg mx-auto">
            <GlassCardContent className="py-8 text-center">
              <p className="text-red-400 mb-6">{error}</p>
              <Button
                onClick={loadInitial}
                className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Tentar Novamente
              </Button>
            </GlassCardContent>
          </GlassCard>
        </main>
      </PageContainer>
    );
  }

  return (
    <PageContainer showOrbs maxWidth="4xl">
      <PageHeader
        title="AI Tarot"
        showBack
        backHref="/"
        showLanguageToggle
      />

      <main className="px-4 sm:px-6 py-8 sm:py-12 space-y-8">
        {/* Page Title */}
        <AnimatedSection variant="fadeUpBlur">
          <PageTitle
            title="Histórico de Leituras"
            subtitle={
              data?.totalCount === 0
                ? "Você ainda não fez nenhuma leitura"
                : `${data?.totalCount} leitura${data?.totalCount === 1 ? "" : "s"} no total`
            }
          />
        </AnimatedSection>

        {/* Empty State or Reading List */}
        {data?.readings.length === 0 ? (
          <AnimatedSection variant="slideUp" delay={0.1}>
            <GlassCard intensity="medium" padding="lg" className="max-w-lg mx-auto">
              <GlassCardContent className="py-12 text-center">
                <div className="text-6xl mb-6">🔮</div>
                <h3 className="text-xl font-semibold text-white mb-3">
                  Nenhuma leitura ainda
                </h3>
                <p className="text-white/70 mb-8">
                  Faça sua primeira leitura de tarot para começar
                </p>
                <Link href="/demo">
                  <Button className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white shadow-lg shadow-purple-500/25">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Fazer uma Leitura
                  </Button>
                </Link>
              </GlassCardContent>
            </GlassCard>
          </AnimatedSection>
        ) : (
          <div className="space-y-4">
            {data?.readings.map((reading, index) => (
              <AnimatedSection key={reading.id} variant="slideUp" delay={0.05 * index}>
                <Link href={`/history/${reading.id}`}>
                  <GlassCard
                    intensity="light"
                    padding="none"
                    className="hover:border-purple-500/30 transition-all duration-200 cursor-pointer group"
                  >
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-white font-medium text-lg group-hover:text-purple-300 transition-colors">
                            {truncateText(reading.question, 80)}
                          </h3>
                          <div className="flex items-center gap-2 mt-2 text-white/60 text-sm">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{formatDate(reading.createdAt)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="px-3 py-1.5 bg-purple-500/20 text-purple-300 text-xs font-medium rounded-full border border-purple-500/20">
                            {SPREAD_LABELS[reading.spreadType] ?? reading.spreadType}
                          </span>
                          <span className="px-3 py-1.5 bg-white/10 text-white/80 text-xs font-medium rounded-full border border-white/10">
                            {reading.cardCount} carta{reading.cardCount === 1 ? "" : "s"}
                          </span>
                        </div>
                      </div>
                      {reading.summary && (
                        <p className="text-white/60 text-sm mt-3 leading-relaxed">
                          {truncateText(reading.summary, 150)}
                        </p>
                      )}
                    </div>
                  </GlassCard>
                </Link>
              </AnimatedSection>
            ))}

            {/* Load More Button */}
            {data?.hasMore && (
              <AnimatedSection variant="fadeIn" delay={0.2} className="text-center pt-4">
                <Button
                  onClick={loadMore}
                  disabled={loadingMore}
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  {loadingMore ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Carregando...
                    </>
                  ) : (
                    "Carregar Mais"
                  )}
                </Button>
              </AnimatedSection>
            )}
          </div>
        )}

        {/* Back Link */}
        <div className="text-center pt-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 text-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para o início
          </Link>
        </div>
      </main>
    </PageContainer>
  );
}

function HistoryPageSkeleton() {
  return (
    <PageContainer showOrbs maxWidth="4xl">
      <PageHeader title="AI Tarot" showBack backHref="/" />
      <main className="px-4 sm:px-6 py-8 sm:py-12 space-y-8">
        <div className="text-center space-y-3">
          <div className="h-10 w-64 bg-white/10 rounded-lg mx-auto animate-pulse" />
          <div className="h-5 w-40 bg-white/5 rounded mx-auto animate-pulse" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <GlassCardSkeleton key={i} className="h-32" />
          ))}
        </div>
      </main>
    </PageContainer>
  );
}
