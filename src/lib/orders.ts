import type { Order } from "@/types/order";
import { storageKey } from "@/config/branding";

function ordersKey(email: string) {
  return storageKey(`orders:${email.toLowerCase()}`);
}

/**
 * Reads a user's saved order history, most recent first, from this
 * pre-backend `localStorage` store.
 *
 * Deprecated as of Phase 28 (Orders, Backend-Integrated): Checkout and
 * Account now read/write real orders via `lib/api/orders.ts` against the
 * backend instead of this file. The only remaining first-party caller is
 * `lib/adminStats.ts`'s dashboard order count, which - like its product
 * count after Phase 27 and its customer count after Phase 26 - was
 * intentionally left on its pre-backend source rather than migrated,
 * since the admin dashboard itself is out of this phase's scope. See
 * `MASTER_HANDOFF.md` Known Issues.
 */
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
 * Appends a placed order to a user's history in this pre-backend
 * `localStorage` store.
 *
 * Deprecated as of Phase 28 - Checkout no longer calls this (it writes
 * to the real `orders` table via `apiSaveOrderForUser()` instead). Kept
 * only so `lib/adminStats.ts`'s deprecated order count (see
 * `getOrdersForUser()` above) has data to read in tests that exercise
 * it directly.
 */
export function saveOrderForUser(email: string, order: Order): void {
  const existing = getOrdersForUser(email);
  window.localStorage.setItem(ordersKey(email), JSON.stringify([order, ...existing]));
}
