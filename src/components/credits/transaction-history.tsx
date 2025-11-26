"use client";

import type { CreditTransaction } from "@/lib/services/credits";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface TransactionHistoryProps {
  transactions: CreditTransaction[];
}

export function TransactionHistory({ transactions }: TransactionHistoryProps) {
  if (transactions.length === 0) {
    return (
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Histórico de Transações</CardTitle>
          <CardDescription className="text-gray-400">
            Suas transações de créditos aparecerão aqui
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-center py-8">
            Nenhuma transação ainda
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-800/50 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white">Histórico de Transações</CardTitle>
        <CardDescription className="text-gray-400">
          Últimas {transactions.length} transações
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {transactions.map((transaction) => (
            <TransactionRow key={transaction.id} transaction={transaction} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function TransactionRow({ transaction }: { transaction: CreditTransaction }) {
  const isPositive = transaction.delta > 0;

  return (
    <div className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg">
      <div className="flex items-center gap-3">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center ${
            isPositive ? "bg-green-500/20" : "bg-red-500/20"
          }`}
        >
          <span className={isPositive ? "text-green-400" : "text-red-400"}>
            {getTransactionIcon(transaction.type)}
          </span>
        </div>
        <div>
          <p className="text-white font-medium">
            {getTransactionLabel(transaction.type)}
          </p>
          <p className="text-gray-500 text-sm">
            {transaction.description ?? formatDate(transaction.createdAt)}
          </p>
        </div>
      </div>
      <div className="text-right">
        <p
          className={`font-semibold ${
            isPositive ? "text-green-400" : "text-red-400"
          }`}
        >
          {isPositive ? "+" : ""}
          {transaction.delta}
        </p>
        <p className="text-gray-500 text-xs">
          {formatDate(transaction.createdAt)}
        </p>
      </div>
    </div>
  );
}

function getTransactionIcon(type: string): string {
  switch (type) {
    case "reading":
      return "🔮";
    case "purchase":
      return "💳";
    case "bonus":
      return "🎁";
    case "welcome":
      return "👋";
    case "refund":
      return "↩️";
    case "adjustment":
      return "⚙️";
    default:
      return "•";
  }
}

function getTransactionLabel(type: string): string {
  switch (type) {
    case "reading":
      return "Leitura de Tarot";
    case "purchase":
      return "Compra de Créditos";
    case "bonus":
      return "Bônus";
    case "welcome":
      return "Créditos de Boas-vindas";
    case "refund":
      return "Reembolso";
    case "adjustment":
      return "Ajuste";
    default:
      return "Transação";
  }
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
