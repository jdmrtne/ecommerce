import { Link } from "react-router-dom";
import { CraftIcon } from "@/components/ui/CraftIcon";
import { Card } from "@/components/ui/Card";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { useInView } from "@/hooks/useInView";
import { resolveAllCategories } from "@/lib/categoriesStore";
import { CATEGORIES_SECTION } from "@/content/homepage";
import type { SectionOverrideProps } from "@/types/layout";
import { backgroundClass, paddingClass, resolveSectionSettings, widthClass } from "@/lib/sectionStyle";
import { cn } from "@/lib/cn";

const DEFAULT_SETTINGS = { padding: "lg", background: "transparent", width: "default", align: "center" } as const;

export function Categories({ title, subtitle, settings }: SectionOverrideProps) {
  const { ref, isInView } = useInView<HTMLDivElement>();
  const s = resolveSectionSettings(DEFAULT_SETTINGS, settings);
  const categories = resolveAllCategories();

  return (
    <section className={cn("mx-auto px-4 sm:px-6 lg:px-8", paddingClass(s), backgroundClass(s), widthClass(s))}>
      <SectionHeading
        eyebrow={CATEGORIES_SECTION.eyebrow}
        title={title ?? CATEGORIES_SECTION.title}
        description={subtitle ?? CATEGORIES_SECTION.description}
        align={s.align}
      />

      <div
        ref={ref}
        className="mt-10 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4"
      >
        {categories.map((category, i) => (
          <Link
            key={category.id}
            to={`/shop?category=${category.id}`}
            className={isInView ? "animate-fade-up" : "opacity-0"}
            style={{ animationDelay: `${i * 90}ms` }}
          >
            <Card
              hoverable
              padding="lg"
              className="flex h-full flex-col items-center gap-3 text-center"
            >
              <CraftIcon category={category.id} className="h-20 w-20" iconClassName="h-8 w-8" />
              <div>
                <h3 className="font-semibold text-ink">{category.label}</h3>
                <p className="mt-1 text-sm text-ink-soft">{category.description}</p>
              </div>
              <span className="text-xs font-semibold uppercase tracking-wide text-denim">
                {category.itemCount} {CATEGORIES_SECTION.itemsUnitLabel}
              </span>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}
