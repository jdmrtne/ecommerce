import { cn } from "@/lib/cn";
import { ICON_REGISTRY, DEFAULT_ICON } from "@/lib/iconRegistry";
import { resolveCategoryById } from "@/lib/categoriesStore";
import type { CraftCategory } from "@/types/product";

interface CraftIconProps {
  category: CraftCategory;
  className?: string;
  iconClassName?: string;
}

/**
 * Renders an organic "blob" shape (an off-round path, not a plain circle)
 * tinted to the category's accent, with the category's lucide icon
 * centered on top. Used everywhere a product photo would normally go -
 * a real product photo doesn't exist yet for this mock catalog, so an
 * illustrated stand-in is used as a placeholder. Falls back to a generic
 * package icon in a neutral tone if `category` doesn't match any entry in
 * the resolved category list (`lib/categoriesStore.ts`, live/override-aware
 * as of Phase 20).
 */
export function CraftIcon({ category, className, iconClassName }: CraftIconProps) {
  const meta = resolveCategoryById(category);
  const Icon = (meta && ICON_REGISTRY[meta.icon]) || DEFAULT_ICON;
  const tone = meta?.tone ?? "primary";
  const fill = tone === "primary" ? "var(--color-denim-tint)" : "var(--color-bloom-tint)";
  const iconColor = tone === "primary" ? "var(--color-denim)" : "var(--color-bloom)";

  return (
    <div className={cn("relative flex items-center justify-center", className)} aria-hidden="true">
      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full">
        <path
          d="M50 6c15 0 24 10 32 20s16 20 8 34-24 20-40 20-32-8-38-24S6 26 20 14 35 6 50 6Z"
          fill={fill}
        />
      </svg>
      <Icon
        className={cn("relative", iconClassName)}
        color={iconColor}
        strokeWidth={1.6}
      />
    </div>
  );
}
