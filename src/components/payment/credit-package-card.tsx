"use client";

import { redirectToCheckout } from "@/app/actions/payment";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface CreditPackage {
  id: string;
  credits: number;
  priceInCents: number;
  currency: string;
  name: string;
  nameEn: string;
  priceDisplay: string;
  pricePerCredit: string;
  popular?: boolean;
  bestValue?: boolean;
}

interface CreditPackageCardProps {
  package: CreditPackage;
}

export function CreditPackageCard({ package: pkg }: CreditPackageCardProps) {
  const isHighlighted = pkg.popular || pkg.bestValue;

  return (
    <Card
      className={`relative bg-gray-800/50 border-gray-700 ${
        isHighlighted ? "ring-2 ring-purple-500" : ""
      }`}
    >
      {pkg.popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="bg-purple-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
            Mais Popular
          </span>
        </div>
      )}
      {pkg.bestValue && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="bg-green-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
            Melhor Valor
          </span>
        </div>
      )}

      <CardHeader className={isHighlighted ? "pt-6" : ""}>
        <CardTitle className="text-white text-center">
          {pkg.credits} Créditos
        </CardTitle>
        <CardDescription className="text-center text-gray-400">
          {pkg.pricePerCredit} por crédito
        </CardDescription>
      </CardHeader>

      <CardContent className="text-center">
        <div className="mb-4">
          <span className="text-4xl font-bold text-white">{pkg.priceDisplay}</span>
        </div>

        <ul className="text-sm text-gray-400 space-y-2">
          <li>✓ {pkg.credits} leituras simples</li>
          <li>✓ {Math.floor(pkg.credits / 2)} leituras de 5 cartas</li>
          <li>✓ Créditos não expiram</li>
        </ul>
      </CardContent>

      <CardFooter>
        <form action={redirectToCheckout} className="w-full">
          <input type="hidden" name="packageId" value={pkg.id} />
          <Button
            type="submit"
            className={`w-full ${
              isHighlighted
                ? "bg-purple-600 hover:bg-purple-700"
                : "bg-gray-700 hover:bg-gray-600"
            } text-white`}
          >
            Comprar
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}
