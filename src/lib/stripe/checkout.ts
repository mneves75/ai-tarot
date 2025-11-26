import "server-only";
import { stripe } from "./client";
import { CREDIT_PACKAGES } from "@/lib/config/constants";
import { auditLog, type AuditLogLevel } from "@/lib/audit/logger";

/**
 * Stripe Checkout Service
 *
 * Creates checkout sessions for purchasing credits.
 *
 * @module lib/stripe/checkout
 */

export interface CreateCheckoutSessionInput {
  userId: string;
  userEmail: string;
  packageId: string;
  successUrl: string;
  cancelUrl: string;
}

export interface CheckoutSession {
  id: string;
  url: string;
}

/**
 * Create a Stripe Checkout Session for credit purchase.
 *
 * @param input - The checkout session parameters
 * @returns The checkout session ID and URL
 */
export async function createCheckoutSession(
  input: CreateCheckoutSessionInput
): Promise<CheckoutSession> {
  const creditPackage = CREDIT_PACKAGES.find((p) => p.id === input.packageId);

  if (!creditPackage) {
    throw new Error(`Invalid package ID: ${input.packageId}`);
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    customer_email: input.userEmail,
    line_items: [
      {
        price_data: {
          currency: creditPackage.currency.toLowerCase(),
          product_data: {
            name: creditPackage.name,
            description: `${creditPackage.credits} créditos para leituras de tarot`,
            metadata: {
              package_id: creditPackage.id,
              credits: creditPackage.credits.toString(),
            },
          },
          unit_amount: creditPackage.priceInCents,
        },
        quantity: 1,
      },
    ],
    metadata: {
      user_id: input.userId,
      package_id: creditPackage.id,
      credits: creditPackage.credits.toString(),
    },
    success_url: `${input.successUrl}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: input.cancelUrl,
    // Pix payment for Brazil (if available)
    payment_method_options: {
      card: {
        installments: {
          enabled: true,
        },
      },
    },
  });

  if (!session.url) {
    throw new Error("Failed to create checkout session URL");
  }

  await auditLog({
    event: "payment.checkout_created",
    level: "info" as AuditLogLevel,
    userId: input.userId,
    sessionId: undefined,
    resource: "payment",
    resourceId: session.id,
    action: "checkout_create",
    success: true,
    errorMessage: undefined,
    durationMs: undefined,
    metadata: {
      packageId: creditPackage.id,
      credits: creditPackage.credits,
      amountCents: creditPackage.priceInCents,
      currency: creditPackage.currency,
    },
  });

  return {
    id: session.id,
    url: session.url,
  };
}

/**
 * Retrieve a checkout session by ID.
 *
 * @param sessionId - The Stripe checkout session ID
 * @returns The checkout session details
 */
export async function getCheckoutSession(sessionId: string) {
  return stripe.checkout.sessions.retrieve(sessionId);
}

/**
 * Get the payment intent from a checkout session.
 *
 * @param sessionId - The Stripe checkout session ID
 * @returns The payment intent
 */
export async function getPaymentIntent(sessionId: string) {
  const session = await stripe.checkout.sessions.retrieve(sessionId);

  if (!session.payment_intent || typeof session.payment_intent === "string") {
    return stripe.paymentIntents.retrieve(session.payment_intent as string);
  }

  return session.payment_intent;
}
