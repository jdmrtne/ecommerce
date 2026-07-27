import { useCallback, useEffect, useState } from "react";
import { apiGetOrdersForUser } from "@/lib/api/orders";
import type { Order } from "@/types/order";

export type OrdersStatus = "loading" | "success" | "error";

/**
 * Phase 28 - Orders (Backend-Integrated). Replaces `Account.tsx`'s old
 * direct, synchronous `getOrdersForUser()` (`lib/orders.ts`, a
 * `localStorage` read) with an async fetch against the real backend via
 * `lib/api/orders.ts`, following the same `{ data, status, reload }`
 * shape `hooks/useProducts.ts` (Phase 27) established for this kind of
 * read - loading/success/error, with a `reload()` a caller can hand to
 * an `ErrorState`'s retry action.
 *
 * Unlike `useProducts`, there's no `save`/`remove` here - orders are
 * insert-only from Checkout (see `lib/api/orders.ts`'s doc comment), and
 * nothing in this app edits or deletes a placed order.
 */
export function useOrders(email: string | undefined) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [status, setStatus] = useState<OrdersStatus>("loading");

  const load = useCallback(() => {
    if (!email) {
      setOrders([]);
      setStatus("success");
      return;
    }
    setStatus("loading");
    apiGetOrdersForUser(email)
      .then((data) => {
        setOrders(data);
        setStatus("success");
      })
      .catch(() => setStatus("error"));
  }, [email]);

  useEffect(() => {
    load();
  }, [load]);

  return { orders, status, reload: load };
}
