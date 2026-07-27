import { Link } from "react-router-dom";
import { CraftIcon } from "@/components/ui/CraftIcon";
import { Card } from "@/components/ui/Card";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { useInView } from "@/hooks/useInView";
import { COLLECTIONS, getCollectionProducts } from "@/data/collections";
import { COLLECTIONS_SECTION } from "@/content/homepage";
import type { SectionOverrideProps } from "@/types/layout";
import { backgroundClass, paddingClass, resolveSectionSettings, widthClass } from "@/lib/sectionStyle";
import { cn } from "@/lib/cn";

const DEFAULT_SETTINGS = { padding: "lg", background: "transparent", width: "default", align: "center" } as const;

/**
 * Homepage "Collections" section (Phase 13) - the first consumer of
 * Phase 9's data-only `data/collections.ts` scaffold. Cards use the same
 * illustrated `CraftIcon` placeholder as `Categories`, tinted from the
 * collection's first product's category. Each card links to `/shop`
 * today - a real `/collections/:slug` browsing page is a Phase 14
 * (Dynamic Pages) concern, not this one.
 */
export function Collections({ title, subtitle, settings }: SectionOverrideProps) {
  const { ref, isInView } = useInView<HTMLDivElement>();
  const s = resolveSectionSettings(DEFAULT_SETTINGS, settings);

  if (COLLECTIONS.length === 0) return null;

  return (
    <section className={cn("mx-auto px-4 sm:px-6 lg:px-8", paddingClass(s), backgroundClass(s), widthClass(s))}>
      <SectionHeading
        eyebrow={COLLECTIONS_SECTION.eyebrow}
        title={title ?? COLLECTIONS_SECTION.title}
        description={subtitle ?? COLLECTIONS_SECTION.description}
        align={s.align}
      />

      <div ref={ref} className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
        {COLLECTIONS.map((collection, i) => {
          const products = getCollectionProducts(collection);
          const iconCategory = products[0]?.category ?? "category-a";

          return (
            <Link
              key={collection.id}
              to="/shop"
              className={isInView ? "animate-fade-up" : "opacity-0"}
              style={{ animationDelay: `${i * 90}ms` }}
            >
              <Card hoverable padding="lg" className="flex h-full flex-col items-center gap-3 text-center">
                <CraftIcon category={iconCategory} className="h-20 w-20" iconClassName="h-8 w-8" />
                <div>
                  <h3 className="font-semibold text-ink">{collection.title}</h3>
                  <p className="mt-1 text-sm text-ink-soft">{collection.description}</p>
                </div>
                <span className="text-xs font-semibold uppercase tracking-wide text-denim">
                  {products.length} {products.length === 1 ? "item" : "items"}
                </span>
              </Card>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
