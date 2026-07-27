import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/cn";

interface QuantityStepperProps {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  size?: "sm" | "md";
  className?: string;
  /** Used to build accessible labels, e.g. "Decrease quantity of Honey Bear Plushie". */
  label?: string;
}

/**
 * Numeric stepper used on the product detail page and in the cart drawer.
 * A real <span aria-live> keeps the count announced to screen readers as
 * it changes, without needing a focusable <input> the user could type into.
 */
export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 10,
  size = "md",
  className,
  label = "quantity",
}: QuantityStepperProps) {
  const dimensions = size === "sm" ? "h-9 w-9" : "h-11 w-11";

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border-2 border-beige-dark",
        className,
      )}
    >
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        aria-label={`Decrease ${label}`}
        className={cn(
          "flex items-center justify-center rounded-l-full text-ink transition-colors",
          "hover:bg-beige disabled:opacity-40 disabled:hover:bg-transparent",
          dimensions,
        )}
      >
        <Minus size={size === "sm" ? 14 : 16} />
      </button>
      <span
        className={cn("min-w-8 text-center text-sm font-semibold text-ink", size === "md" && "text-base")}
        aria-live="polite"
      >
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        aria-label={`Increase ${label}`}
        className={cn(
          "flex items-center justify-center rounded-r-full text-ink transition-colors",
          "hover:bg-beige disabled:opacity-40 disabled:hover:bg-transparent",
          dimensions,
        )}
      >
        <Plus size={size === "sm" ? 14 : 16} />
      </button>
    </div>
  );
}
