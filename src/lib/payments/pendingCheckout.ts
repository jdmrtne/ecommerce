import { storageKey } from "@/config/branding";
import type { Order } from "@/types/order";

/**
 * Phase 31 - Payments. A card payment that requires 3D Secure sends the
 * shopper's whole browser tab away to PayMongo's authentication page and
 * back (see `redirectToPaymentAuth()` in `lib/payments/paymongo.ts`) -
 * an ordinary full navigation, not an SPA route change, so any in-memory
 * React state (the filled-in Checkout form, the already-built `Order`)
 * is gone by the time `CheckoutPaymentReturn.tsx` mounts.
 *
 * The cart itself survives that round trip fine (`CartProvider` persists
 * to `localStorage`), but the *built* order - order number, shipping
 * snapshot, line snapshot, totals - does not exist anywhere else, so it's
 * stashed here first. `sessionStorage` (not `localStorage`) is
 * deliberate: this data is only ever needed for the one active
 * checkout-in-progress tab, and should not linger indefinitely or leak
 * into a different tab/session the way a `localStorage` write would.
 *
 * Keyed by Payment Intent id, not a single fixed key, so a stale/reused
 * key from an abandoned earlier attempt can never be mistaken for the
 * current one - `CheckoutPaymentReturn.tsx` reads using the same id
 * PayMongo redirects back with.
 */

interface PendingCardCheckout {
  order: Order;
  /** The signed-in shopper's email, or null for a guest checkout - mirrors `Checkout.tsx`'s existing `user ? apiSaveOrderForUser(...) : ...` branch. */
  userEmail: string | null;
}

function keyFor(paymentIntentId: string): string {
  return storageKey(`pending-card-checkout-${paymentIntentId}`);
}

export function savePendingCardCheckout(paymentIntentId: string, pending: PendingCardCheckout): void {
  window.sessionStorage.setItem(keyFor(paymentIntentId), JSON.stringify(pending));
}

export function loadPendingCardCheckout(paymentIntentId: string): PendingCardCheckout | null {
  const raw = window.sessionStorage.getItem(keyFor(paymentIntentId));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PendingCardCheckout;
  } catch {
    return null;
  }
}

export function clearPendingCardCheckout(paymentIntentId: string): void {
  window.sessionStorage.removeItem(keyFor(paymentIntentId));
}
