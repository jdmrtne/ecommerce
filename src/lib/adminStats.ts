import { COLLECTIONS } from "@/data/collections";
import { DYNAMIC_PAGES } from "@/config/layouts/pages";
import { resolveActivePreset } from "@/lib/themeSettingsStore";
import { resolveActiveHomeLayoutId } from "@/lib/homepageSettingsStore";
import { getCachedProducts } from "@/lib/productsStore";
import { resolveAllCategories } from "@/lib/categoriesStore";
import { getRegisteredUsers } from "@/lib/userStore";
import { getOrdersForUser } from "@/lib/orders";

export interface AdminStats {
  activePresetName: string;
  activePresetId: string;
  activeHomeLayout: string;
  productCount: number;
  categoryCount: number;
  collectionCount: number;
  dynamicPageCount: number;
  customerCount: number;
  orderCount: number;
}

/**
 * Read-only snapshot of current site state for the `/admin` dashboard
 * (Phase 15). Every value is derived live from existing config/data - none
 * of it is hardcoded, and none of it is a stub: this is the same data the
 * storefront itself renders from.
 *
 * Order count is a sum across every registered account's own
 * `localStorage`-persisted order history (`lib/orders.ts`) - there's no
 * single global order list yet (orders are namespaced per user, same as
 * the rest of this pre-backend template), so this walks every registered
 * user and totals their individual histories. Guest checkouts (nobody
 * signed in) aren't saved anywhere and so aren't counted - same
 * limitation `Account.tsx`'s own order history already has.
 *
 * `activePresetName`/`activePresetId` resolve through `resolveActivePreset()`
 * (Phase 17), and `activeHomeLayout` through `resolveActiveHomeLayoutId()`
 * (Phase 18), so a Theme/Homepage Editor save shows up here too, not just
 * the static config defaults.
 *
 * `productCount` is the one exception to "derived live" above, since
 * Phase 27 moved the catalog to the real (async) backend and this
 * function is synchronous: it reads `productsStore.ts`'s deprecated
 * in-memory cache, which is accurate once any page has fetched the real
 * catalog this session (Shop, Product Manager, etc.) but starts seeded
 * with the static placeholder catalog otherwise - see that file's doc
 * comment and `MASTER_HANDOFF.md` Known Issues.
 */
export function getAdminStats(): AdminStats {
  const users = getRegisteredUsers();
  const customerCount = users.filter((u) => u.role === "customer").length;
  const orderCount = users.reduce((total, u) => total + getOrdersForUser(u.email).length, 0);
  const activePreset = resolveActivePreset();

  return {
    activePresetName: activePreset.name,
    activePresetId: activePreset.id,
    activeHomeLayout: resolveActiveHomeLayoutId(),
    productCount: getCachedProducts().length,
    categoryCount: resolveAllCategories().length,
    collectionCount: COLLECTIONS.length,
    dynamicPageCount: Object.keys(DYNAMIC_PAGES).length,
    customerCount,
    orderCount,
  };
}
