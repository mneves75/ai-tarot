import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Clock, Cpu, Globe, Sparkles, History, AlertTriangle } from "lucide-react";
import { requireUser } from "@/lib/dal";
import { getUserReadingDetail } from "@/app/actions/history";
import { Button } from "@/components/ui/button";
import { ReadingJournal } from "@/components/journal";
import { PageContainer, PageTitle } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardContent } from "@/components/ui/glass-card";

export const metadata = {
  title: "Detalhes da Leitura - AI Tarot",
  description: "Visualize os detalhes completos da sua leitura de tarot.",
};

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

const SPREAD_LABELS: Record<string, string> = {
  one: "Leitura de 1 Carta",
  three: "Leitura de 3 Cartas",
  five: "Leitura de 5 Cartas",
};

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export default async function ReadingDetailPage({ params }: PageProps) {
  await requireUser();
  const { id } = await params;

  const reading = await getUserReadingDetail(id);

  if (!reading) {
    notFound();
  }

  return (
    <PageContainer showOrbs maxWidth="4xl">
      <PageHeader
        title="AI Tarot"
        showBack
        backHref="/history"
        showLanguageToggle
      />

      <main className="px-4 sm:px-6 py-8 sm:py-12 space-y-8">
        {/* Header with Breadcrumb */}
        <div className="space-y-4">
          <Link
            href="/history"
            className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 text-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar ao histórico
          </Link>
          <PageTitle
            title={SPREAD_LABELS[reading.spreadType] ?? reading.spreadType}
            subtitle={formatDate(reading.createdAt)}
            centered={false}
          />
        </div>

        {/* Question Card */}
        <GlassCard intensity="medium" padding="lg">
          <GlassCardHeader>
            <GlassCardTitle className="text-sm uppercase tracking-wider text-purple-400 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Sua Pergunta
            </GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent>
            <p className="text-white text-lg leading-relaxed">{reading.question}</p>
          </GlassCardContent>
        </GlassCard>

        {/* Cards Grid */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
              🃏
            </span>
            As Cartas
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {reading.cards.map((readingCard) => (
              <GlassCard
                key={readingCard.id}
                intensity="light"
                padding="none"
              >
                <div className="p-5 space-y-4">
                  {/* Card Header */}
                  <div>
                    <p className="text-purple-400 text-xs uppercase tracking-wider font-medium mb-1">
                      {readingCard.positionRole}
                    </p>
                    <h3 className="text-white font-semibold text-lg flex items-center gap-2">
                      {readingCard.card.name}
                      {readingCard.orientation === "reversed" && (
                        <span className="text-xs px-2 py-0.5 bg-red-500/20 text-red-300 rounded-full border border-red-500/20">
                          Invertida
                        </span>
                      )}
                    </h3>
                  </div>

                  {/* Card Image */}
                  {readingCard.card.imageUrl && (
                    <div className="relative w-full aspect-[2/3] rounded-lg overflow-hidden border border-white/10">
                      <Image
                        src={readingCard.card.imageUrl}
                        alt={readingCard.card.name}
                        fill
                        className={`object-cover ${
                          readingCard.orientation === "reversed"
                            ? "rotate-180"
                            : ""
                        }`}
                      />
                    </div>
                  )}

                  {/* Keywords */}
                  <div>
                    <p className="text-white/60 text-xs uppercase tracking-wider mb-2">
                      Palavras-chave
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {(readingCard.orientation === "upright"
                        ? readingCard.card.keywordsUpright
                        : readingCard.card.keywordsReversed
                      ).map((keyword) => (
                        <span
                          key={keyword}
                          className="px-2 py-1 bg-purple-500/15 text-purple-300 text-xs rounded-full border border-purple-500/20"
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Meaning */}
                  <div>
                    <p className="text-white/60 text-xs uppercase tracking-wider mb-2">
                      Significado
                    </p>
                    <p className="text-white/80 text-sm leading-relaxed">
                      {readingCard.orientation === "upright"
                        ? readingCard.card.descriptionUpright
                        : readingCard.card.descriptionReversed}
                    </p>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>

        {/* AI Interpretation */}
        {reading.aiOutput && (
          <GlassCard intensity="medium" padding="lg">
            <GlassCardHeader>
              <GlassCardTitle className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-purple-400" />
                Interpretação
              </GlassCardTitle>
              <p className="text-white/60 text-sm mt-1">
                Gerada por IA especificamente para sua pergunta
              </p>
            </GlassCardHeader>
            <GlassCardContent className="space-y-6">
              {/* Summary */}
              {reading.summary && (
                <div>
                  <h3 className="text-purple-400 text-sm uppercase tracking-wider mb-3 font-medium">
                    Resumo
                  </h3>
                  <p className="text-white/90 leading-relaxed">{reading.summary}</p>
                </div>
              )}

              {/* Per-Card Interpretations */}
              {reading.aiOutput.perCard && reading.aiOutput.perCard.length > 0 && (
                <div>
                  <h3 className="text-purple-400 text-sm uppercase tracking-wider mb-4 font-medium">
                    Interpretação das Cartas
                  </h3>
                  <div className="space-y-4">
                    {reading.aiOutput.perCard.map((cardInterp) => (
                      <div
                        key={cardInterp.position}
                        className="bg-black/30 rounded-xl p-4 border border-white/10"
                      >
                        <h4 className="text-white font-medium mb-2">
                          {cardInterp.position}
                        </h4>
                        <p className="text-white/80 text-sm leading-relaxed">
                          {cardInterp.interpretation}
                        </p>
                        {cardInterp.advice && (
                          <p className="text-purple-300 text-sm mt-3 italic border-l-2 border-purple-500/30 pl-3">
                            {cardInterp.advice}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Overall Message */}
              {reading.aiOutput.overallMessage && (
                <div>
                  <h3 className="text-purple-400 text-sm uppercase tracking-wider mb-3 font-medium">
                    Mensagem Geral
                  </h3>
                  <p className="text-white/90 leading-relaxed">{reading.aiOutput.overallMessage}</p>
                </div>
              )}

              {/* Safety Reminder */}
              {reading.aiOutput.safetyReminder && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
                  <h3 className="text-amber-400 text-sm uppercase tracking-wider mb-2 font-medium flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Lembrete
                  </h3>
                  <p className="text-amber-200/80 text-sm leading-relaxed">
                    {reading.aiOutput.safetyReminder}
                  </p>
                </div>
              )}
            </GlassCardContent>
          </GlassCard>
        )}

        {/* Journal */}
        <div>
          <ReadingJournal readingId={reading.id} />
        </div>

        {/* Metadata */}
        <GlassCard intensity="light" padding="sm">
          <GlassCardContent>
            <div className="flex flex-wrap gap-4 text-xs text-white/50">
              <span className="flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5" />
                Modelo: {reading.model}
              </span>
              {reading.latencyMs && (
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  Tempo: {reading.latencyMs}ms
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5" />
                Idioma: {reading.language.toUpperCase()}
              </span>
            </div>
          </GlassCardContent>
        </GlassCard>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
          <Link href="/demo">
            <Button className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white shadow-lg shadow-purple-500/25">
              <Sparkles className="w-4 h-4 mr-2" />
              Nova Leitura
            </Button>
          </Link>
          <Link href="/history">
            <Button
              variant="outline"
              className="w-full sm:w-auto border-white/20 text-white hover:bg-white/10"
            >
              <History className="w-4 h-4 mr-2" />
              Ver Histórico
            </Button>
          </Link>
        </div>
      </main>
    </PageContainer>
  );
}
