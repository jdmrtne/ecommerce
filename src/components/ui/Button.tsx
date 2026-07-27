import { forwardRef } from "react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  icon?: ReactNode;
  iconPosition?: "left" | "right";
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-denim text-surface hover:bg-denim-deep active:bg-denim-deep shadow-soft",
  secondary:
    "bg-bloom text-surface hover:bg-bloom-deep active:bg-bloom-deep shadow-soft",
  outline:
    "border-2 border-beige-dark text-ink bg-transparent hover:border-denim hover:text-denim",
  ghost: "bg-transparent text-ink hover:bg-beige",
  danger: "bg-error text-surface hover:brightness-90",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "text-sm px-4 py-2 gap-1.5",
  md: "text-base px-6 py-3 gap-2",
  lg: "text-lg px-8 py-4 gap-2.5",
};

/**
 * Base interactive control for the whole app. Every clickable action that
 * isn't plain navigation should render through this component so states
 * (loading, disabled, focus) stay consistent site-wide.
 *
 * Shape (`rounded` / `pill` / `square`) is controlled by the active
 * template preset's `buttonStyle` (`config/presets/`), not a prop - see
 * the `--btn-radius` CSS hook in `index.css`.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      disabled,
      icon,
      iconPosition = "left",
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          "inline-flex items-center justify-center rounded-[var(--btn-radius)] font-semibold",
          "transition-all duration-200 ease-out",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:brightness-100",
          "active:scale-[0.97]",
          variantStyles[variant],
          sizeStyles[size],
          className,
        )}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="animate-spin" size={size === "sm" ? 16 : 20} />
        ) : (
          icon && iconPosition === "left" && icon
        )}
        {children}
        {!isLoading && icon && iconPosition === "right" && icon}
      </button>
    );
  },
);

Button.displayName = "Button";
