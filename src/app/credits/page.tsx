import { Suspense } from "react";
import Link from "next/link";
import { Coins, TrendingUp, ShoppingBag, Plus, Sparkles, ArrowLeft } from "lucide-react";
import { requireUser } from "@/lib/dal";
import { getCreditsOverview } from "@/app/actions/credits";
import { TransactionHistory } from "@/components/credits/transaction-history";
import { Button } from "@/components/ui/button";
import { SkeletonGrid, SkeletonCard } from "@/components/ui/skeleton";
import { CreditsPageClient } from "./credits-client";

export const metadata = {
  title: "Credits - AI Tarot",
  description: "Manage your credits and view your transaction history.",
};

export default async function CreditsPage() {
  await requireUser();
  const overview = await getCreditsOverview();

  if (!overview) {
    return (
      <CreditsPageClient
        overview={null}
        error="Failed to load credits"
      />
    );
  }

  return (
    <CreditsPageClient overview={overview} />
  );
}
