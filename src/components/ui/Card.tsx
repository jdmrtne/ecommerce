import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
}

const paddingStyles = {
  none: "",
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

/**
 * Generic surface container - product cards, testimonial cards, form
 * panels, dashboard tiles all wrap in this so radius/shadow/border stay
 * consistent.
 *
 * Shape (`soft` / `flat` / `outlined`) is controlled by the active
 * template preset's `cardStyle` (`config/presets/`), not a prop - see the
 * `--card-radius`/`--card-shadow`/`--card-border-color` CSS hooks in
 * `index.css`. `outlined` cards get a visible border in the ink color;
 * `soft`/`flat` stay borderless (their border-beige is effectively
 * invisible against the surface background, kept for hover/focus states
 * on cards that opt into one).
 */
export function Card({
  className,
  hoverable = false,
  padding = "md",
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        "bg-surface rounded-[var(--card-radius)] border border-[var(--card-border-color)] shadow-[var(--card-shadow)]",
        paddingStyles[padding],
        hoverable &&
          "transition-all duration-300 ease-out hover:shadow-lift hover:-translate-y-1",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
