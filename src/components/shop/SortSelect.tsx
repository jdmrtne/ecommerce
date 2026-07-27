import { useId } from "react";
import { ChevronDown } from "lucide-react";
import { SORT_LABELS } from "@/lib/productFilters";
import type { SortOption } from "@/types/product";

interface SortSelectProps {
  value: SortOption;
  onChange: (value: SortOption) => void;
}

const OPTIONS = Object.keys(SORT_LABELS) as SortOption[];

/** Native <select> for sort order - styled to match Input's field conventions, kept native for built-in mobile/accessibility behavior. */
export function SortSelect({ value, onChange }: SortSelectProps) {
  const id = useId();

  return (
    <div className="relative w-full sm:w-56">
      <label htmlFor={id} className="sr-only">
        Sort products
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value as SortOption)}
        className="w-full appearance-none rounded-md border-2 border-beige bg-surface px-4 py-2.5 pr-10 text-sm font-medium text-ink transition-colors duration-200 focus:border-denim focus:outline-none"
      >
        {OPTIONS.map((option) => (
          <option key={option} value={option}>
            {SORT_LABELS[option]}
          </option>
        ))}
      </select>
      <ChevronDown
        size={16}
        className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-soft"
        aria-hidden="true"
      />
    </div>
  );
}
