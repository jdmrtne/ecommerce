import { LogOut, Package } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { EmptyState } from "@/components/ui/StateMessage";
import { formatPHP } from "@/lib/currency";
import { getOrdersForUser } from "@/lib/orders";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { EMPTY_STATES } from "@/content/states";
import { PAGE_META } from "@/config/site";
import { useSiteMeta } from "@/hooks/useSiteMeta";

/**
 * Protected by RequireAuth in App.tsx - only reachable when logged in.
 * Order history reads straight from localStorage via getOrdersForUser();
 * no simulated fetch here for the same reason Wishlist.tsx skips one -
 * this data never left the browser.
 */
export function Account() {
  useSiteMeta(PAGE_META.account);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null; // RequireAuth guarantees this never renders - keeps TS happy

  const orders = getOrdersForUser(user.email);

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <SectionHeading eyebrow="Your account" title={`Hi, ${user.name.split(" ")[0]}`} align="left" />

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <Card padding="lg" className="h-fit lg:col-span-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Name</p>
          <p className="mt-1 font-semibold text-ink">{user.name}</p>
          <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-ink-soft">Email</p>
          <p className="mt-1 font-semibold text-ink">{user.email}</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-6 w-full"
            icon={<LogOut size={16} />}
            onClick={() => {
              // This page is wrapped in RequireAuth, which re-renders
              // whenever isAuthenticated changes and redirects to /login if
              // it's false - including the split second after logout()
              // flips it. A client-side navigate("/") right after logout()
              // can't reliably win that race (confirmed by direct testing,
              // true even wrapped in flushSync): React Router's own
              // location state isn't guaranteed to have caught up with an
              // imperative navigate() call yet, so RequireAuth can still
              // redirect to /login using the stale /account pathname before
              // our navigate("/") takes effect.
              //
              // A real page navigation (not react-router's navigate())
              // sidesteps the SPA routing race entirely, since there's no
              // React tree left to race against. It's also a reasonable
              // choice for a "log out" action regardless - it guarantees a
              // clean reset of all in-memory state, not just auth.
              //
              // Phase 26: logout() is now async (a real Supabase signOut
              // call) - it's awaited before navigating away so the page
              // unload can't abort the request before it reaches Supabase.
              void logout().then(() => {
                window.location.href = "/";
              });
            }}
          >
            Log out
          </Button>
        </Card>

        <div className="lg:col-span-2">
          <h2 className="font-display text-xl text-ink">Order history</h2>
          {orders.length === 0 ? (
            <div className="mt-4">
              <EmptyState {...EMPTY_STATES.orders} onAction={() => navigate("/shop")} />
            </div>
          ) : (
            <ul className="mt-4 flex flex-col gap-4">
              {orders.map((order) => (
                <li key={order.orderNumber}>
                  <Card padding="md">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Package size={18} className="text-denim" />
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
    </div>
  );
}
