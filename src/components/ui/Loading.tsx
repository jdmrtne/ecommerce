import { cn } from "@/lib/cn";

interface SpinnerProps {
  size?: number;
  className?: string;
}

/** Small inline spinner - the squiggle motif rendered as a spin loader. */
export function Spinner({ size = 24, className }: SpinnerProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={cn("animate-spin", className)}
      role="status"
      aria-label="Loading"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="var(--color-beige-dark)"
        strokeWidth="3"
      />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="var(--color-bloom)"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Full-section loading state with a label, for page/route-level fetches. */
export function LoadingState({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24 text-ink-soft">
      <Spinner size={32} />
      <p className="text-sm">{label}</p>
    </div>
  );
}
