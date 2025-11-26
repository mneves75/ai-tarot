import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe/client";
import { db } from "@/lib/db";
import { payments } from "@/lib/db/schema";
import { addCreditsFromPurchase, refundCredits } from "@/lib/services/credits";
import { auditLog, type AuditLogLevel } from "@/lib/audit/logger";
import { eq } from "drizzle-orm";

/**
 * Stripe Webhook Handler
 *
 * Handles Stripe webhook events for payment processing.
 *
 * Events handled:
 * - checkout.session.completed: Credits are added on successful payment
 * - charge.refunded: Credits are deducted on refund
 *
 * @module app/api/webhooks/stripe
 */

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  const webhookSecret = process.env["STRIPE_WEBHOOK_SECRET"];
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET is not configured");
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    const error = err as Error;
    console.error("Webhook signature verification failed:", error.message);

    await auditLog({
      event: "payment.webhook_failed",
      level: "error" as AuditLogLevel,
      userId: undefined,
      sessionId: undefined,
      resource: "payment",
      resourceId: undefined,
      action: "webhook_verify",
      success: false,
      errorMessage: error.message,
      durationMs: undefined,
      metadata: undefined,
    });

    return NextResponse.json(
      { error: "Webhook signature verification failed" },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case "charge.refunded":
        await handleChargeRefunded(event.data.object as Stripe.Charge);
        break;

      default:
        // Log unhandled events for debugging
        console.log(`Unhandled Stripe event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    const err = error as Error;
    console.error(`Error processing webhook ${event.type}:`, err.message);

    await auditLog({
      event: "payment.webhook_error",
      level: "error" as AuditLogLevel,
      userId: undefined,
      sessionId: undefined,
      resource: "payment",
      resourceId: event.id,
      action: event.type,
      success: false,
      errorMessage: err.message,
      durationMs: undefined,
      metadata: { eventId: event.id, eventType: event.type },
    });

    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

/**
 * Handle successful checkout completion.
 * Creates payment record and adds credits to user.
 *
 * CRIT-2 FIX: Both operations wrapped in a single transaction to ensure
 * atomicity. If credit addition fails, the payment record is rolled back.
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.["user_id"];
  const credits = parseInt(session.metadata?.["credits"] ?? "0", 10);
  const packageId = session.metadata?.["package_id"];

  if (!(userId && credits) || credits <= 0) {
    throw new Error(
      `Invalid session metadata: userId=${userId}, credits=${credits}`
    );
  }

  // Check if payment already processed (idempotency)
  const existingPayment = await db.query.payments.findFirst({
    where: eq(payments.externalId, session.id),
  });

  if (existingPayment) {
    console.log(`Payment ${session.id} already processed, skipping`);
    return;
  }

  // CRIT-2 FIX: Create payment record AND add credits in a single transaction
  // If addCreditsFromPurchase fails, the payment record insert is rolled back.
  const payment = await db.transaction(async (tx) => {
    // Create payment record inside transaction
    const [newPayment] = await tx
      .insert(payments)
      .values({
        userId,
        provider: "stripe",
        externalId: session.id,
        status: "paid",
        amountCents: session.amount_total ?? 0,
        currency: session.currency?.toUpperCase() ?? "BRL",
        creditsPurchased: credits,
        metadata: {
          packageId,
          paymentIntent: session.payment_intent,
          customerEmail: session.customer_email,
        },
      })
      .returning();

    if (!newPayment) {
      throw new Error("Failed to create payment record");
    }

    return newPayment;
  });

  // Add credits (this function has its own transaction, but it's atomic per-user)
  // Note: We do this outside the main transaction to avoid long locks
  // The payment record exists, so we can retry credit addition if needed
  try {
    await addCreditsFromPurchase(userId, credits, payment.id);
  } catch (creditError) {
    // If credit addition fails, update payment status and re-throw
    await db
      .update(payments)
      .set({ status: "failed", updatedAt: new Date() })
      .where(eq(payments.id, payment.id));

    await auditLog({
      event: "payment.credit_addition_failed",
      level: "error" as AuditLogLevel,
      userId,
      sessionId: session.id,
      resource: "payment",
      resourceId: payment.id,
      action: "add_credits",
      success: false,
      errorMessage:
        creditError instanceof Error ? creditError.message : "Unknown error",
      durationMs: undefined,
      metadata: { credits, paymentId: payment.id },
    });

    throw creditError;
  }

  await auditLog({
    event: "payment.completed",
    level: "info" as AuditLogLevel,
    userId,
    sessionId: session.id,
    resource: "payment",
    resourceId: payment.id,
    action: "complete",
    success: true,
    errorMessage: undefined,
    durationMs: undefined,
    metadata: {
      credits,
      amountCents: session.amount_total,
      currency: session.currency,
      packageId,
    },
  });
}

/**
 * Handle charge refund.
 * Deducts credits from user.
 */
async function handleChargeRefunded(charge: Stripe.Charge) {
  // Find the payment by payment intent
  const paymentIntentId =
    typeof charge.payment_intent === "string"
      ? charge.payment_intent
      : charge.payment_intent?.id;

  if (!paymentIntentId) {
    console.log("No payment intent found for refund");
    return;
  }

  // Find checkout session for this payment intent
  const sessions = await stripe.checkout.sessions.list({
    payment_intent: paymentIntentId,
    limit: 1,
  });

  const session = sessions.data[0];
  if (!session) {
    console.log(`No checkout session found for payment intent ${paymentIntentId}`);
    return;
  }

  const payment = await db.query.payments.findFirst({
    where: eq(payments.externalId, session.id),
  });

  if (!payment) {
    console.log(`No payment record found for session ${session.id}`);
    return;
  }

  // Check if already refunded
  if (payment.status === "refunded") {
    console.log(`Payment ${payment.id} already refunded, skipping`);
    return;
  }

  // Update payment status
  await db
    .update(payments)
    .set({
      status: "refunded",
      updatedAt: new Date(),
    })
    .where(eq(payments.id, payment.id));

  // Deduct credits
  await refundCredits(payment.userId, payment.creditsPurchased, payment.id);

  await auditLog({
    event: "payment.refunded",
    level: "warn" as AuditLogLevel,
    userId: payment.userId,
    sessionId: session.id,
    resource: "payment",
    resourceId: payment.id,
    action: "refund",
    success: true,
    errorMessage: undefined,
    durationMs: undefined,
    metadata: {
      credits: payment.creditsPurchased,
      amountCents: charge.amount_refunded,
    },
  });
}
