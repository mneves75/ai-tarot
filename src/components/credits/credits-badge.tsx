"use client";

import Link from "next/link";

interface CreditsBadgeProps {
  balance: number;
}

export function CreditsBadge({ balance }: CreditsBadgeProps) {
  const isLow = balance <= 3;

  return (
    <Link
      href="/credits"
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
        isLow
          ? "bg-amber-500/20 text-amber-400 hover:bg-amber-500/30"
          : "bg-purple-500/20 text-purple-400 hover:bg-purple-500/30"
      }`}
    >
      <span>🔮</span>
      <span>{balance}</span>
      <span className="sr-only">créditos</span>
    </Link>
  );
}
