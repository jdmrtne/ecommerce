import { useCallback, useEffect, useState } from "react";
import { apiGetCustomers } from "@/lib/api/auth";
import type { AuthUser } from "@/context/AuthContext";

export type CustomersStatus = "loading" | "success" | "error";

/**
 * Phase 30 - Customers. Same `{ data, status, reload }` shape
 * `hooks/useProducts.ts`/`hooks/useOrders.ts` established for a
 * backend-integrated list read, wrapping `apiGetCustomers()` (plumbing
 * added back in Phase 25, unused by any UI until now). Read-only - there's
 * no admin flow to create/edit/delete a customer account here, only to
 * view the registered list and each one's order history (`useOrders`,
 * reused as-is on `CustomerDetail.tsx`).
 */
export function useCustomers() {
  const [customers, setCustomers] = useState<AuthUser[]>([]);
  const [status, setStatus] = useState<CustomersStatus>("loading");

  const load = useCallback(() => {
    setStatus("loading");
    apiGetCustomers()
      .then((data) => {
        setCustomers(data);
        setStatus("success");
      })
      .catch(() => setStatus("error"));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { customers, status, reload: load };
}
