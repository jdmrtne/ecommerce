import { Link, NavLink, Outlet } from "react-router-dom";
import { LogOut, ExternalLink } from "lucide-react";
import { ADMIN_NAV } from "@/config/adminNav";
import { useStoreSettings } from "@/hooks/useStoreSettings";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";

/**
 * Admin area shell (Phase 15). Deliberately its own top-level layout, not
 * nested under the storefront `<Layout />` - the admin has no use for the
 * public navbar/footer/announcement bar, and a distinct sidebar shell
 * makes it visually obvious you're in a different part of the app.
 *
 * Every future admin section (Store Settings, Theme, Homepage, Products,
 * Categories, Navigation, Footer, Policies, Media) is listed in the
 * sidebar via `ADMIN_NAV` even though only Dashboard is wired to a real
 * route yet - unavailable items render as inert rows with a "Soon" badge
 * rather than dead links, so nothing 404s before its phase lands.
 */
export function AdminLayout() {
  const { user, logout } = useAuth();
  const { branding } = useStoreSettings();

  return (
    <div className="flex min-h-screen bg-cream">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-beige-dark bg-surface md:flex">
        <div className="px-6 py-6">
          <Link to="/admin" className="font-display text-lg text-ink">
            {branding.businessName}
            <span className="ml-2 text-sm font-normal text-ink-soft">Admin</span>
          </Link>
        </div>
        <nav className="flex flex-1 flex-col gap-1 px-3">
          {ADMIN_NAV.map((item) => {
            const Icon = item.icon;
            if (!item.available || !item.path) {
              return (
                <div
                  key={item.label}
                  className="flex items-center justify-between rounded-[var(--radius-md)] px-3 py-2 text-sm text-ink-soft/60"
                >
                  <span className="flex items-center gap-3">
                    <Icon size={18} />
                    {item.label}
                  </span>
                  <span className="rounded-full bg-beige px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-ink-soft">
                    Soon
                  </span>
                </div>
              );
            }
            return (
              <NavLink
                key={item.label}
                to={item.path}
                end={item.path === "/admin"}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2 text-sm font-medium transition-colors",
                    isActive ? "bg-denim text-surface" : "text-ink hover:bg-beige",
                  )
                }
              >
                <Icon size={18} />
                {item.label}
              </NavLink>
            );
          })}
        </nav>
        <div className="border-t border-beige-dark px-6 py-4">
          <Link to="/" className="flex items-center gap-2 text-sm font-medium text-ink-soft hover:text-denim">
            <ExternalLink size={16} />
            Back to store
          </Link>
        </div>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-beige-dark bg-surface px-4 py-4 sm:px-8">
          <Link to="/admin" className="font-display text-base text-ink md:hidden">
            {branding.businessName} <span className="text-ink-soft">Admin</span>
          </Link>
          <div className="hidden text-sm text-ink-soft md:block">Signed in as {user?.name}</div>
          <Button
            variant="ghost"
            size="sm"
            icon={<LogOut size={16} />}
            onClick={() => {
              // Phase 26: logout() is now async (a real Supabase signOut
              // call) - awaited before the hard navigation below, same
              // reasoning as Account.tsx's own logout button.
              void logout().then(() => {
                window.location.href = "/";
              });
            }}
          >
            Log out
          </Button>
        </header>
        <main className="flex-1 px-4 py-8 sm:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
