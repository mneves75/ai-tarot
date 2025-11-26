"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";

interface CreditsBalanceProps {
  balance: number;
  totalSpent: number;
  totalPurchased: number;
}

export function CreditsBalance({
  balance,
  totalSpent,
  totalPurchased,
}: CreditsBalanceProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader className="pb-2">
          <CardDescription className="text-gray-400">
            Saldo Atual
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-white">{balance}</span>
            <span className="text-gray-400">créditos</span>
          </div>
          {balance <= 3 && (
            <p className="text-amber-400 text-sm mt-2">
              Você está com poucos créditos!
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader className="pb-2">
          <CardDescription className="text-gray-400">
            Total Gasto
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-white">{totalSpent}</span>
            <span className="text-gray-400">créditos</span>
          </div>
          <p className="text-gray-500 text-sm mt-2">
            Em leituras de tarot
          </p>
        </CardContent>
      </Card>

      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader className="pb-2">
          <CardDescription className="text-gray-400">
            Total Comprado
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-white">
              {totalPurchased}
            </span>
            <span className="text-gray-400">créditos</span>
          </div>
          <p className="text-gray-500 text-sm mt-2">
            Incluindo bônus
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
