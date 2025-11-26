"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { requireUser } from "@/lib/dal";
import { createCheckoutSession, getCheckoutSession } from "@/lib/stripe/checkout";
import { CREDIT_PACKAGES } from "@/lib/config/constants";
import { ValidationError, toClientSafeError } from "@/lib/errors";

/**
 * Payment Server Actions
 *
 * @module app/actions/payment
 */

// ============================================================
// TYPES
// ============================================================

export interface PaymentActionResult {
  success: boolean;
  error?: string;
  code?: string;
  redirectUrl?: string;
}

export interface PaymentSuccessData {
  packageId: string;
  credits: number;
  amountDisplay: string;
}

// ============================================================
// SERVER ACTIONS
// ============================================================

/**
 * Create a checkout session and redirect to Stripe.
 */
export async function createPaymentSession(
  packageId: string
): Promise<PaymentActionResult> {
  try {
    const user = await requireUser();

    // Validate package
    const creditPackage = CREDIT_PACKAGES.find((p) => p.id === packageId);
    if (!creditPackage) {
      throw new ValidationError("Pacote de créditos inválido");
    }

    // Get origin for success/cancel URLs
    const headersList = await headers();
    const origin = headersList.get("origin") ?? "http://localhost:3000";

    // Create checkout session
    const session = await createCheckoutSession({
      userId: user.id,
      userEmail: user.email,
      packageId,
      successUrl: `${origin}/payment/success`,
      cancelUrl: `${origin}/buy-credits`,
    });

    return {
      success: true,
      redirectUrl: session.url,
    };
  } catch (error) {
    const safeError = toClientSafeError(error);
    return {
      success: false,
      error: safeError.message,
      code: safeError.code,
    };
  }
}

/**
 * Verify a successful payment and get details.
 */
export async function verifyPaymentSuccess(
  sessionId: string
): Promise<PaymentSuccessData | null> {
  try {
    await requireUser();

    const session = await getCheckoutSession(sessionId);

    if (session.payment_status !== "paid") {
      return null;
    }

    const packageId = session.metadata?.["package_id"];
    const credits = parseInt(session.metadata?.["credits"] ?? "0", 10);

    const creditPackage = CREDIT_PACKAGES.find((p) => p.id === packageId);

    return {
      packageId: packageId ?? "unknown",
      credits,
      amountDisplay: creditPackage
        ? formatCurrency(creditPackage.priceInCents, creditPackage.currency)
        : formatCurrency(session.amount_total ?? 0, session.currency ?? "BRL"),
    };
  } catch {
    return null;
  }
}

/**
 * Redirect to Stripe checkout (form action).
 */
export async function redirectToCheckout(formData: FormData): Promise<void> {
  const packageId = formData.get("packageId");

  if (!packageId || typeof packageId !== "string") {
    throw new ValidationError("Pacote de créditos não selecionado");
  }

  const result = await createPaymentSession(packageId);

  if (result.success && result.redirectUrl) {
    redirect(result.redirectUrl);
  }

  // If we get here, something went wrong
  throw new Error(result.error ?? "Erro ao criar sessão de pagamento");
}

// ============================================================
// HELPERS
// ============================================================

function formatCurrency(amountInCents: number, currency: string): string {
  const amount = amountInCents / 100;

  if (currency.toUpperCase() === "BRL") {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(amount);
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount);
}

/**
 * Get credit packages for display.
 */
export async function getCreditPackages() {
  return CREDIT_PACKAGES.map((pkg) => ({
    ...pkg,
    priceDisplay: formatCurrency(pkg.priceInCents, pkg.currency),
    pricePerCredit: formatCurrency(
      Math.round(pkg.priceInCents / pkg.credits),
      pkg.currency
    ),
  }));
}
