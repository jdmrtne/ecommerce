import { forwardRef, useId } from "react";
import type { SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hint?: string;
}

/**
 * Native `<select>` styled to match `Input`'s field conventions (border/
 * radius/focus ring, optional `label`/`hint`) - kept native rather than a
 * custom listbox for built-in mobile and keyboard/screen-reader behavior,
 * same reasoning as `components/shop/SortSelect.tsx`. Introduced in Phase
 * 17 for the Theme Editor's font/radius/card-style/button-style pickers;
 * reusable by any future admin form that needs a closed-choice field.
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, hint, id, children, ...props }, ref) => {
    const generatedId = useId();
    const selectId = id ?? generatedId;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={selectId} className="mb-1.5 block text-sm font-medium text-ink">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={cn(
              "w-full appearance-none rounded-md border-2 border-beige bg-surface px-4 py-2.5 pr-10 text-ink",
              "transition-colors duration-200 focus:border-denim focus:outline-none",
              "disabled:cursor-not-allowed disabled:opacity-50",
              className,
            )}
            {...props}
          >
            {children}
          </select>
          <ChevronDown
            size={16}
            className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-soft"
            aria-hidden="true"
          />
        </div>
        {hint && <p className="mt-1.5 text-sm text-ink-soft">{hint}</p>}
      </div>
    );
  },
);
Select.displayName = "Select";
