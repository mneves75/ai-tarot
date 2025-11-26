import "server-only";
import Stripe from "stripe";

/**
 * Stripe client for server-side operations.
 *
 * SECURITY: This client uses the secret key and should ONLY be used server-side.
 * Never expose this client to the browser.
 *
 * @module lib/stripe/client
 */

if (!process.env["STRIPE_SECRET_KEY"]) {
  throw new Error("STRIPE_SECRET_KEY environment variable is not set");
}

export const stripe = new Stripe(process.env["STRIPE_SECRET_KEY"], {
  apiVersion: "2025-11-17.clover",
  typescript: true,
});

/**
 * Get the Stripe publishable key for client-side operations.
 */
export function getStripePublishableKey(): string {
  const key = process.env["NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"];
  if (!key) {
    throw new Error("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set");
  }
  return key;
}
