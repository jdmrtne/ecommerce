import type { Order } from "@/types/order";
import { storageKey } from "@/config/branding";

function ordersKey(email: string) {
  return storageKey(`orders:${email.toLowerCase()}`);
}

/** Reads a user's saved order history, most recent first. */
export function getOrdersForUser(email: string): Order[] {
  try {
    const stored = window.localStorage.getItem(ordersKey(email));
    if (!stored) return [];
    const parsed = JSON.parse(stored) as unknown;
    return Array.isArray(parsed) ? (parsed as Order[]) : [];
  } catch {
    return [];
  }
}

/**
 * Appends a placed order to a user's history. Called from Checkout right
 * after placeOrder() succeeds, only when someone is logged in - guest
 * orders still work (the receipt shows on /order-confirmation), they just
 * aren't saved anywhere to look up again later.
 */
export function saveOrderForUser(email: string, order: Order): void {
  const existing = getOrdersForUser(email);
  window.localStorage.setItem(ordersKey(email), JSON.stringify([order, ...existing]));
}
