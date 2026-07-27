import { resolveAllCategories } from "@/lib/categoriesStore";
import { getCategoryFilterLabels } from "@/lib/productFilters";
import { cn } from "@/lib/cn";
import type { CraftCategory } from "@/types/product";

interface CategoryFilterProps {
  value: CraftCategory | "all";
  onChange: (value: CraftCategory | "all") => void;
  className?: string;
}

/** Pill-style category filter. Horizontally scrollable on mobile so it never wraps awkwardly. */
export function CategoryFilter({ value, onChange, className }: CategoryFilterProps) {
  const categories = resolveAllCategories();
  const options: (CraftCategory | "all")[] = ["all", ...categories.map((c) => c.id)];
  const labels = getCategoryFilterLabels(categories);

  return (
    <div
      className={cn("flex gap-2 overflow-x-auto pb-1 [scrollbar-width:thin]", className)}
      role="group"
      aria-label="Filter by category"
    >
      {options.map((option) => {
        const isActive = value === option;
        return (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            aria-pressed={isActive}
            className={cn(
              "shrink-0 rounded-full border-2 px-4 py-2 text-sm font-semibold transition-colors duration-200",
              isActive
                ? "border-denim bg-denim text-surface"
                : "border-beige-dark bg-transparent text-ink hover:border-denim hover:text-denim",
            )}
          >
            {labels[option]}
          </button>
        );
      })}
    </div>
  );
}
