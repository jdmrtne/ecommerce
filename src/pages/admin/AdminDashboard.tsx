import type { ComponentType, ReactNode } from "react";
import { Palette, LayoutTemplate, ShoppingBag, Tags, FolderKanban, Files, Users, Receipt } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { getAdminStats } from "@/lib/adminStats";
import { PAGE_META } from "@/config/site";
import { useSiteMeta } from "@/hooks/useSiteMeta";

interface StatCardProps {
  icon: ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: ReactNode;
}

function StatCard({ icon: Icon, label, value }: StatCardProps) {
  return (
    <Card padding="lg" className="flex items-center gap-4">
      <div className="flex size-11 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-denim-tint text-denim-deep">
        <Icon size={22} />
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">{label}</p>
        <p className="font-display text-2xl text-ink">{value}</p>
      </div>
    </Card>
  );
}

/**
 * `/admin` dashboard (Phase 15) - a genuinely-useful read-only summary of
 * current site state, not a stub. Every value comes from `getAdminStats()`
 * (`lib/adminStats.ts`), which reads the same config/data the storefront
 * itself renders from - nothing here is hardcoded. No editing yet; that's
 * Phases 16-24, each of which will extend this same admin shell.
 */
export function AdminDashboard() {
  useSiteMeta(PAGE_META.admin);
  const stats = getAdminStats();

  return (
    <div className="mx-auto max-w-5xl">
      <SectionHeading eyebrow="Admin" title="Dashboard" align="left" />

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard icon={Palette} label="Active preset" value={stats.activePresetName} />
        <StatCard icon={LayoutTemplate} label="Homepage layout" value={stats.activeHomeLayout} />
        <StatCard icon={ShoppingBag} label="Products" value={stats.productCount} />
        <StatCard icon={Tags} label="Categories" value={stats.categoryCount} />
        <StatCard icon={FolderKanban} label="Collections" value={stats.collectionCount} />
        <StatCard icon={Files} label="Dynamic pages" value={stats.dynamicPageCount} />
        <StatCard icon={Users} label="Registered customers" value={stats.customerCount} />
        <StatCard icon={Receipt} label="Orders placed" value={stats.orderCount} />
      </div>

      <Card padding="lg" className="mt-8">
        <h2 className="font-display text-lg text-ink">What&apos;s next</h2>
        <p className="mt-2 text-sm text-ink-soft">
          This is the admin foundation: routing, layout, and auth-gating. Editing tools for each
          section listed in the sidebar (Store Settings, Theme, Homepage, Products, and the rest)
          ship one at a time in upcoming phases - see <code>docs/ROADMAP.md</code>.
        </p>
      </Card>
    </div>
  );
}
