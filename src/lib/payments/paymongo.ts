import type { AttachPaymentMethodResult, CardDetails, PaymentIntentRef, PaymentIntentStatus } from "@/types/payment";

/**
 * Phase 31 - Payments. Provider: PayMongo (confirmed with Jude - see
 * ROADMAP.md Phase 31 / MASTER_HANDOFF.md). Test-mode credentials only;
 * see `.env.example` for the switch-to-live-keys note.
 *
 * PayMongo's Payment Intent + Payment Method workflow splits credentials
 * by trust level, and this file mirrors that split:
 * - `VITE_PAYMONGO_PUBLIC_KEY` is safe in client code (same idea as a
 *   Stripe publishable key) - `createPaymentMethod()` below calls
 *   PayMongo directly from the browser with it, so raw card details are
 *   sent straight to PayMongo and never touch this app's own server.
 * - The secret key never appears here. Creating a Payment Intent and
 *   attaching a Payment Method to it both require the secret key, so
 *   both go through this app's own `/api/paymongo/*` serverless
 *   functions (see `api/paymongo/`), which are the only place that key
 *   is read (from `PAYMONGO_SECRET_KEY`, a server-only env var - note
 *   the lack of the `VITE_` prefix that would otherwise get it bundled
 *   into client code).
 */

const PAYMONGO_API = "https://api.paymongo.com/v1";

function publicKey(): string {
  const key = import.meta.env.VITE_PAYMONGO_PUBLIC_KEY;
  if (!key) {
    throw new Error("Card payments aren't configured for this store yet. Please choose a different payment method.");
  }
  return key;
}

function basicAuthHeader(key: string): string {
  return `Basic ${btoa(`${key}:`)}`;
}

/** Extracts a shopper-readable message from a PayMongo (or this app's own API) error response. */
async function extractErrorMessage(response: Response, fallback: string): Promise<string> {
  try {
    const json = (await response.json()) as { errors?: { detail?: string }[]; error?: string };
    return json.errors?.[0]?.detail ?? json.error ?? fallback;
  } catch {
    return fallback;
  }
}

/**
 * Tokenizes raw card details with PayMongo directly from the browser
 * (public key only) and returns the resulting Payment Method id. Never
 * routed through this app's own backend - see the file-level comment.
 */
export async function createPaymentMethod(card: CardDetails): Promise<string> {
  const response = await fetch(`${PAYMONGO_API}/payment_methods`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: basicAuthHeader(publicKey()),
    },
    body: JSON.stringify({
      data: {
        attributes: {
          type: "card",
          details: {
            card_number: card.number.replace(/\s+/g, ""),
            exp_month: card.expMonth,
            exp_year: card.expYear,
            cvc: card.cvc,
          },
          billing: { name: card.name },
        },
      },
    }),
  });
  if (!response.ok) {
    throw new Error(await extractErrorMessage(response, "We couldn't process that card. Please check the details and try again."));
  }
  const json = (await response.json()) as { data: { id: string } };
  return json.data.id;
}

/** Creates a PayMongo Payment Intent for `amountCentavos` via this app's own serverless function (secret key stays server-side). */
export async function createPaymentIntent(amountCentavos: number, description: string): Promise<PaymentIntentRef> {
  const response = await fetch("/api/paymongo/create-intent", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount: amountCentavos, description }),
  });
  if (!response.ok) {
    throw new Error(await extractErrorMessage(response, "We couldn't start your payment. Please try again."));
  }
  const json = (await response.json()) as { id: string };
  return { id: json.id };
}

/**
 * Attaches a Payment Method to a Payment Intent via this app's own
 * serverless function (server-side attach, per PayMongo's own
 * recommendation - no client_key needed, the secret key alone
 * authenticates and identifies the intent by id).
 */
export async function attachPaymentMethod(
  paymentIntentId: string,
  paymentMethodId: string,
  returnUrl: string,
): Promise<AttachPaymentMethodResult> {
  const response = await fetch("/api/paymongo/attach-payment-method", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ paymentIntentId, paymentMethodId, returnUrl }),
  });
  if (!response.ok) {
    throw new Error(await extractErrorMessage(response, "Your payment could not be processed. Please try again."));
  }
  const json = (await response.json()) as { status: PaymentIntentStatus; nextActionUrl: string | null };
  return json;
}

/** Retrieves the current status of a Payment Intent - used after a 3D Secure redirect returns to the app. */
export async function retrievePaymentIntent(paymentIntentId: string): Promise<PaymentIntentStatus> {
  const response = await fetch(`/api/paymongo/payment-intent-status?id=${encodeURIComponent(paymentIntentId)}`);
  if (!response.ok) {
    throw new Error(await extractErrorMessage(response, "We couldn't confirm your payment status. Please contact support."));
  }
  const json = (await response.json()) as { status: PaymentIntentStatus };
  return json.status;
}

/**
 * Thin wrapper around a full-page navigation to PayMongo's 3D Secure
 * authentication page - its own function (rather than an inline
 * `window.location.href = ...` in Checkout.tsx) purely so tests can
 * mock it instead of triggering a real jsdom navigation.
 */
export function redirectToPaymentAuth(url: string): void {
  window.location.href = url;
}
