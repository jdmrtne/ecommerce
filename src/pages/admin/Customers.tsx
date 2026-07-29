import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search, ChevronRight, ShieldCheck, User } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { EmptyState, ErrorState } from "@/components/ui/StateMessage";
import { Skeleton } from "@/components/ui/Skeleton";
import { useCustomers } from "@/hooks/useCustomers";
import { PAGE_META } from "@/config/site";
import { useSiteMeta } from "@/hooks/useSiteMeta";
import { ERROR_STATES, EMPTY_STATES } from "@/content/states";
import type { UserRole } from "@/lib/userStore";

type RoleFilter = "all" | UserRole;

/**
 * Phase 30 - Customers. Admin-facing customer list, distinct from the
 * account-holder's own `/account` self-service view: reads every
 * registered account via `useCustomers()` (wrapping `apiGetCustomers()`,
 * plumbing added back in Phase 25 but unused by any UI until now) rather
 * than one signed-in user's own profile. Search/filter here is purely
 * client-side over the already-fetched list, the same "search the list
 * you have, not a separate backend query" choice Product Manager (Phase
 * 19) and Category Manager (Phase 20) made for finding a record to
 * manage - this list is small enough (every registered account) that a
 * dedicated search endpoint isn't warranted.
 *
 * Read-only: there's no create/edit/delete here. An admin follows a row
 * through to `CustomerDetail.tsx` for that account's order history -
 * editing a customer's own name/email/role isn't in this phase's scope
 * (see `ROADMAP.md`).
 */
export function Customers() {
  useSiteMeta(PAGE_META.adminCustomers);
  const { customers, status, reload } = useCustomers();

  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");

  const filtered = useMemo(() => {
    const trimmedQuery = query.trim().toLowerCase();
    return customers.filter((c) => {
      const matchesRole = roleFilter === "all" || c.role === roleFilter;
      const matchesQuery =
        trimmedQuery === "" ||
        c.name.toLowerCase().includes(trimmedQuery) ||
        c.email.toLowerCase().includes(trimmedQuery);
      return matchesRole && matchesQuery;
    });
  }, [customers, query, roleFilter]);

  return (
    <div className="mx-auto max-w-4xl">
      <SectionHeading eyebrow="Admin" title="Customers" align="left" />

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or email..."
            aria-label="Search customers"
            className="pl-10"
          />
          <Search
            size={18}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-soft"
            aria-hidden="true"
          />
        </div>
        <Select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as RoleFilter)}
          aria-label="Filter by role"
          className="sm:w-48"
        >
          <option value="all">All roles</option>
          <option value="customer">Customer</option>
          <option value="admin">Admin</option>
        </Select>
      </div>

      {status === "success" && (
        <p className="mt-4 text-sm text-ink-soft">
          {filtered.length} of {customers.length} {customers.length === 1 ? "customer" : "customers"}
        </p>
      )}

      <Card padding="none" className="mt-3 overflow-hidden" data-testid="customer-list">
        {status === "loading" && (
          <div className="flex flex-col divide-y divide-beige">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4">
                <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-1/3" />
                </div>
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        )}

        {status === "error" && <ErrorState {...ERROR_STATES.adminCustomers} onAction={reload} />}

        {status === "success" && filtered.length === 0 && (
          <EmptyState
            title={customers.length === 0 ? "No customers yet" : EMPTY_STATES.adminCustomersNoResults.title}
            description={
              customers.length === 0
                ? "No one has registered an account yet."
                : EMPTY_STATES.adminCustomersNoResults.description
            }
          />
        )}

        {status === "success" && filtered.length > 0 && (
          <div className="flex flex-col divide-y divide-beige">
            {filtered.map((customer) => (
              <Link
                key={customer.email}
                to={`/admin/customers/${encodeURIComponent(customer.email)}`}
                className="flex items-center gap-4 p-4 transition-colors hover:bg-beige/30"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-beige/50 text-ink-soft">
                  {customer.role === "admin" ? (
                    <ShieldCheck size={18} className="text-denim" aria-hidden="true" />
                  ) : (
                    <User size={18} aria-hidden="true" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-ink">{customer.name}</p>
                  <p className="truncate text-xs text-ink-soft">{customer.email}</p>
                </div>
                <span className="hidden shrink-0 rounded-full border-2 border-beige px-2.5 py-0.5 text-xs font-medium capitalize text-ink-soft sm:inline-block">
                  {customer.role}
                </span>
                <ChevronRight size={16} className="shrink-0 text-ink-soft" aria-hidden="true" />
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
