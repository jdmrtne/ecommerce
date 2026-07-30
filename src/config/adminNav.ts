import type { ComponentType } from "react";
import {
  LayoutDashboard,
  Store,
  Palette,
  Home,
  ShoppingBag,
  Tags,
  Navigation as NavigationIcon,
  PanelBottom,
  FileText,
  Image,
  Users,
  Truck,
} from "lucide-react";

export interface AdminNavItem {
  label: string;
  icon: ComponentType<{ size?: number; className?: string }>;
  /** Root-relative path under /admin. Only present once the section is actually routed. */
  path?: string;
  /** Whether this section has a real, working admin page yet (Phase 15: only Dashboard). */
  available: boolean;
}

/**
 * Every future admin section (Phase 15 scope: list them all, even though
 * only Dashboard was functional at first - Phases 16-24 each wire one of
 * these up to a real path; Phase 16 added Store Settings, Phase 17 added
 * Theme, Phase 18 added Homepage, Phase 19 added Products, Phase 20 added
 * Categories, Phase 21 added Navigation, Phase 22 added Footer, Phase 23
 * added Policies, Phase 24 added Media, Phase 30 added Customers).
 * Sections without a `path` render as inert "Coming soon" list items
 * rather than dead links, so nothing 404s. Phase 31 (Payments) added no
 * entry here - it's a checkout-time flow, not an admin-configured
 * section. Phase 32 added Shipping.
 */
export const ADMIN_NAV: AdminNavItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/admin", available: true },
  { label: "Store Settings", icon: Store, path: "/admin/store-settings", available: true },
  { label: "Theme", icon: Palette, path: "/admin/theme", available: true },
  { label: "Homepage", icon: Home, path: "/admin/homepage", available: true },
  { label: "Products", icon: ShoppingBag, path: "/admin/products", available: true },
  { label: "Categories", icon: Tags, path: "/admin/categories", available: true },
  { label: "Navigation", icon: NavigationIcon, path: "/admin/navigation", available: true },
  { label: "Footer", icon: PanelBottom, path: "/admin/footer", available: true },
  { label: "Policies", icon: FileText, path: "/admin/policies", available: true },
  { label: "Media", icon: Image, path: "/admin/media", available: true },
  { label: "Customers", icon: Users, path: "/admin/customers", available: true },
  { label: "Shipping", icon: Truck, path: "/admin/shipping", available: true },
];
