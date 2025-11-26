import { Suspense } from "react";
import Link from "next/link";
import { Coins, CreditCard, Shield, Clock } from "lucide-react";
import { requireUser } from "@/lib/dal";
import { getCreditPackages } from "@/app/actions/payment";
import { getCreditBalance } from "@/lib/services/credits";
import { CreditPackageCard } from "@/components/payment/credit-package-card";
import { PageContainer, PageTitle } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardContent } from "@/components/ui/glass-card";
import { GlassCardSkeleton } from "@/components/ui/skeleton";

export const metadata = {
  title: "Comprar Créditos - AI Tarot",
  description: "Adquira créditos para suas leituras de tarot.",
};

export default async function BuyCreditsPage() {
  const user = await requireUser();
  const [packages, balance] = await Promise.all([
    getCreditPackages(),
    getCreditBalance(user.id),
  ]);

  return (
    <PageContainer showOrbs maxWidth="4xl">
      <PageHeader
        title="AI Tarot"
        showBack
        backHref="/"
        showLanguageToggle
      />

      <main className="px-4 sm:px-6 py-8 sm:py-12 space-y-8">
        {/* Page Title with Balance */}
        <div className="text-center space-y-4">
          <PageTitle
            title="Comprar Créditos"
            subtitle="Escolha um pacote para continuar suas leituras"
          />
          {balance && (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20">
              <Coins className="w-4 h-4 text-purple-400" />
              <span className="text-purple-300">
                Saldo atual: <span className="font-semibold text-white">{balance.credits}</span> créditos
              </span>
            </div>
          )}
        </div>

        {/* Credit Packages */}
        <Suspense fallback={<PackagesSkeleton />}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {packages.map((pkg) => (
              <CreditPackageCard key={pkg.id} package={pkg} />
            ))}
          </div>
        </Suspense>

        {/* How Credits Work */}
        <GlassCard intensity="medium" padding="lg" className="max-w-2xl mx-auto">
          <GlassCardHeader>
            <GlassCardTitle className="text-lg flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-purple-400" />
              Como funcionam os créditos?
            </GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent>
            <ul className="space-y-3 text-white/80">
              <li className="flex items-start gap-3">
                <span className="p-1 rounded-full bg-purple-500/20">
                  <Coins className="w-3 h-3 text-purple-300" />
                </span>
                <span>
                  <strong className="text-white">1 crédito</strong> = 1 leitura de carta única ou 3 cartas
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="p-1 rounded-full bg-purple-500/20">
                  <Coins className="w-3 h-3 text-purple-300" />
                </span>
                <span>
                  <strong className="text-white">2 créditos</strong> = 1 leitura de 5 cartas (Cruz Celta)
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="p-1 rounded-full bg-green-500/20">
                  <Clock className="w-3 h-3 text-green-300" />
                </span>
                <span>Créditos não expiram e ficam na sua conta</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="p-1 rounded-full bg-blue-500/20">
                  <Shield className="w-3 h-3 text-blue-300" />
                </span>
                <span>Pagamento seguro via Stripe (cartão de crédito)</span>
              </li>
            </ul>
          </GlassCardContent>
        </GlassCard>

        {/* Navigation Links */}
        <div className="text-center space-y-3">
          <Link
            href="/credits"
            className="text-purple-400 hover:text-purple-300 text-sm block transition-colors"
          >
            Ver meu histórico de créditos
          </Link>
          <Link
            href="/"
            className="text-white/50 hover:text-white/70 text-sm block transition-colors"
          >
            &larr; Voltar para o início
          </Link>
        </div>
      </main>
    </PageContainer>
  );
}

function PackagesSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {[1, 2, 3].map((i) => (
        <GlassCardSkeleton key={i} className="h-64" />
      ))}
    </div>
  );
}
