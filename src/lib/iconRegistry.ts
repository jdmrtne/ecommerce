import {
  Gem,
  Heart,
  Flame,
  Sticker,
  Sparkles,
  PackageCheck,
  Truck,
  Package,
  Star,
  Leaf,
  Coffee,
  Shirt,
  Cake,
  Flower2,
  Gift,
  Palette,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

/**
 * Registry mapping an icon *name* (a plain string, as stored on each
 * category in `src/data/categories.ts` or a content file like
 * `src/content/about.ts`) to the actual lucide-react component. This is
 * what makes categories/content data-driven instead of hardcoded: a
 * white-labeled store just sets `icon: "Coffee"` (or any other key
 * below) on its data - no component code changes. Add more lucide icons
 * here as needed for a new business's categories.
 *
 * Kept in its own file (rather than living in CraftIcon.tsx) because
 * mixing component exports with constant exports in one file breaks
 * Fast Refresh (oxlint's react/only-export-components rule).
 */
export const ICON_REGISTRY: Record<string, LucideIcon> = {
  Gem,
  Heart,
  Flame,
  Sticker,
  Sparkles,
  PackageCheck,
  Truck,
  Package,
  Star,
  Leaf,
  Coffee,
  Shirt,
  Cake,
  Flower2,
  Gift,
  Palette,
};

export const DEFAULT_ICON = Package;
