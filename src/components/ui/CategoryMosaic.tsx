import { ICON_REGISTRY } from "@/lib/iconRegistry";
import { resolveAllCategories } from "@/lib/categoriesStore";

/**
 * 2x2 grid of category icon tiles, standing in for a studio photo.
 * Reads through the live, override-aware category resolver
 * (`lib/categoriesStore.ts`, Phase 20) so it always reflects the active
 * catalog - shared by the homepage "Our story" teaser and the /about
 * page's story section.
 */
export function CategoryMosaic({ className }: { className?: string }) {
  const tiles = resolveAllCategories().slice(0, 4);
  return (
    <div className={className ?? "grid grid-cols-2 gap-4"} aria-hidden="true">
      {tiles.map((category) => {
        const Icon = ICON_REGISTRY[category.icon] ?? ICON_REGISTRY.Package;
        const fill = category.tone === "primary" ? "var(--color-denim-tint)" : "var(--color-bloom-tint)";
        const color = category.tone === "primary" ? "var(--color-denim)" : "var(--color-bloom)";
        return (
          <div
            key={category.id}
            className="relative flex aspect-square items-center justify-center rounded-xl"
            style={{ backgroundColor: fill }}
          >
            <Icon size={40} color={color} strokeWidth={1.4} />
          </div>
        );
      })}
    </div>
  );
}
