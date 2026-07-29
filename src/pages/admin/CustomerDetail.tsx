import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Package, ShieldCheck, User } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { EmptyState, ErrorState } from "@/components/ui/StateMessage";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatPHP } from "@/lib/currency";
import { useCustomers } from "@/hooks/useCustomers";
import { useOrders } from "@/hooks/useOrders";
import { PAGE_META } from "@/config/site";
import { useSiteMeta } from "@/hooks/useSiteMeta";
import { ERROR_STATES, EMPTY_STATES } from "@/content/states";

/**
 * Phase 30 - Customers. The "detail" half of the Customer Manager: a
 * single account's profile fields plus its full order history, reached
 * from a row in `Customers.tsx`. The route param is the customer's email
 * (URL-encoded) rather than a numeric id, since `AuthUser`
 * (`context/AuthContext.ts`) has no id field to route on - email is
 * already this app's unique account key everywhere else (Supabase Auth,
 * `orders.user_email`).
 *
 * Order history reuses `useOrders(email)` (Phase 28) completely as-is -
 * the exact same hook `Account.tsx` uses for a signed-in customer's own
 * history, just pointed at someone else's email. That only returns real
 * data against a live backend because of the admin-read RLS policy this
 * phase also adds to `supabase/schema.sql`'s `orders` table; the
 * `profiles` lookup below relies on the matching admin-read policy added
 * to `profiles`.
 *
 * The matching profile is found by filtering the already-fetched
 * `useCustomers()` list rather than adding a dedicated
 * "get one customer" API call - consistent with the list page's own
 * "search what you already fetched" choice, and avoids a second round
 * trip for what's normally a handful of registered accounts.
 */
export function CustomerDetail() {
  useSiteMeta(PAGE_META.adminCustomerDetail);
  const { email: encodedEmail } = useParams<{ email: string }>();
  const email = encodedEmail ? decodeURIComponent(encodedEmail) : undefined;
  const navigate = useNavigate();

  const { customers, status: customersStatus, reload: reloadCustomers } = useCustomers();
  const { orders, status: ordersStatus, reload: reloadOrders } = useOrders(email);

  const customer = customers.find((c) => c.email.toLowerCase() === email?.toLowerCase());

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        to="/admin/customers"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-soft transition-colors hover:text-denim"
      >
        <ArrowLeft size={14} aria-hidden="true" />
        Back to customers
      </Link>

      {customersStatus === "loading" && (
        <div className="mt-6 flex items-center gap-4">
          <Skeleton className="h-14 w-14 shrink-0 rounded-full" />
          <div className="flex-1">
            <Skeleton className="h-5 w-1/3" />
            <Skeleton className="mt-2 h-4 w-1/4" />
          </div>
        </div>
      )}

      {customersStatus === "error" && (
        <div className="mt-6">
          <ErrorState {...ERROR_STATES.adminCustomers} onAction={reloadCustomers} />
        </div>
      )}

      {customersStatus === "success" && !customer && (
        <div className="mt-6">
          <EmptyState
            {...EMPTY_STATES.customerNotFound}
            onAction={() => navigate("/admin/customers")}
          />
        </div>
      )}

      {customersStatus === "success" && customer && (
        <>
          <div className="mt-6">
            <SectionHeading eyebrow="Admin" title={customer.name} align="left" />
          </div>

          <div className="mt-6 grid gap-8 lg:grid-cols-3">
            <Card padding="lg" className="h-fit lg:col-span-1">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-beige/50 text-ink-soft">
                  {customer.role === "admin" ? (
                    <ShieldCheck size={20} className="text-denim" aria-hidden="true" />
                  ) : (
                    <User size={20} aria-hidden="true" />
                  )}
                </div>
                <span className="rounded-full border-2 border-beige px-2.5 py-0.5 text-xs font-medium capitalize text-ink-soft">
                  {customer.role}
                </span>
              </div>
              <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-ink-soft">Name</p>
              <p className="mt-1 font-semibold text-ink">{customer.name}</p>
              <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-ink-soft">Email</p>
              <p className="mt-1 break-all font-semibold text-ink">{customer.email}</p>
            </Card>

            <div className="lg:col-span-2">
              <h2 className="font-display text-xl text-ink">Order history</h2>
              {ordersStatus === "loading" && (
                <ul className="mt-4 flex flex-col gap-4" aria-busy="true" aria-label="Loading orders">
                  {Array.from({ length: 2 }).map((_, i) => (
                    <li key={i}>
                      <Card padding="md">
                        <div className="flex items-center justify-between gap-2">
                          <Skeleton className="h-4 w-28" />
                          <Skeleton className="h-4 w-20" />
                        </div>
                        <Skeleton className="mt-3 h-4 w-24" />
                        <Skeleton className="mt-2 h-6 w-20" />
                      </Card>
                    </li>
                  ))}
                </ul>
              )}
              {ordersStatus === "error" && (
                <div className="mt-4">
                  <ErrorState {...ERROR_STATES.orders} onAction={reloadOrders} />
                </div>
              )}
              {ordersStatus === "success" && orders.length === 0 && (
                <div className="mt-4">
                  <EmptyState {...EMPTY_STATES.orders} />
                </div>
              )}
              {ordersStatus === "success" && orders.length > 0 && (
                <ul className="mt-4 flex flex-col gap-4">
                  {orders.map((order) => (
                    <li key={order.orderNumber}>
                      <Card padding="md">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <Package size={18} className="text-denim" aria-hidden="true" />
                            <span className="font-semibold text-ink">{order.orderNumber}</span>
                          </div>
                          <span className="text-sm text-ink-soft">
                            {new Date(order.placedAt).toLocaleDateString("en-PH", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-ink-soft">
                          {order.lines.length} {order.lines.length === 1 ? "item" : "items"}
                        </p>
                        <p className="mt-1 font-display text-lg text-denim-deep">{formatPHP(order.total)}</p>
                      </Card>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
