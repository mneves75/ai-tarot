import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2, Sparkles, History, ArrowLeft } from "lucide-react";
import { requireUser } from "@/lib/dal";
import { verifyPaymentSuccess } from "@/app/actions/payment";
import { getCreditBalance } from "@/lib/services/credits";
import { Button } from "@/components/ui/button";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardContent } from "@/components/ui/glass-card";
import { GlassCardSkeleton } from "@/components/ui/skeleton";

export const metadata = {
  title: "Pagamento Confirmado - AI Tarot",
  description: "Seu pagamento foi processado com sucesso.",
};

interface PageProps {
  searchParams: Promise<{
    session_id?: string;
  }>;
}

export default async function PaymentSuccessPage({ searchParams }: PageProps) {
  const user = await requireUser();
  const params = await searchParams;

  if (!params.session_id) {
    redirect("/buy-credits");
  }

  const [paymentData, balance] = await Promise.all([
    verifyPaymentSuccess(params.session_id),
    getCreditBalance(user.id),
  ]);

  if (!paymentData) {
    redirect("/buy-credits");
  }

  return (
    <PageContainer showOrbs centered maxWidth="lg">
      <PageHeader title="AI Tarot" showBack backHref="/" />

      <main className="px-4 sm:px-6 py-8 sm:py-12 w-full">
        <Suspense fallback={<SuccessSkeleton />}>
          <GlassCard
            intensity="medium"
            padding="lg"
            animated
            className="max-w-lg mx-auto"
          >
            <GlassCardHeader className="text-center">
              {/* Success Icon */}
              <div className="mx-auto w-20 h-20 bg-gradient-to-br from-green-500/30 to-emerald-500/20 rounded-full flex items-center justify-center mb-6 border border-green-500/30">
                <CheckCircle2 className="w-10 h-10 text-green-400" />
              </div>
              <GlassCardTitle className="text-2xl text-white">
                Pagamento Confirmado!
              </GlassCardTitle>
              <p className="text-white/70 mt-2">
                Seus créditos já estão disponíveis
              </p>
            </GlassCardHeader>

            <GlassCardContent className="space-y-6">
              {/* Payment Summary */}
              <div className="bg-black/30 rounded-xl p-4 space-y-3 border border-white/10">
                <div className="flex justify-between items-center">
                  <span className="text-white/70">Créditos adicionados</span>
                  <span className="text-green-400 font-semibold text-lg">
                    +{paymentData.credits}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/70">Valor pago</span>
                  <span className="text-white font-medium">
                    {paymentData.amountDisplay}
                  </span>
                </div>
                <div className="border-t border-white/10 pt-3 flex justify-between items-center">
                  <span className="text-white/70">Saldo atual</span>
                  <span className="text-purple-400 font-bold text-xl">
                    {balance?.credits ?? 0} créditos
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <Link href="/demo" className="block">
                  <Button className="w-full h-12 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white font-medium shadow-lg shadow-purple-500/25">
                    <Sparkles className="w-5 h-5 mr-2" />
                    Fazer uma Leitura
                  </Button>
                </Link>
                <Link href="/credits" className="block">
                  <Button
                    variant="outline"
                    className="w-full h-11 border-white/20 text-white hover:bg-white/10"
                  >
                    <History className="w-4 h-4 mr-2" />
                    Ver Histórico de Créditos
                  </Button>
                </Link>
              </div>

              {/* Email Notice */}
              <p className="text-center text-white/50 text-sm">
                Um recibo foi enviado para seu email
              </p>
            </GlassCardContent>
          </GlassCard>
        </Suspense>

        {/* Back Link */}
        <div className="text-center mt-8">
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

function SuccessSkeleton() {
  return (
    <GlassCardSkeleton className="max-w-lg mx-auto h-96" />
  );
}
