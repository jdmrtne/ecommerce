import { cn } from "@/lib/cn";

interface SquiggleProps {
  className?: string;
  /** Which accent color the sparkles use */
  tone?: "denim" | "bloom" | "mixed";
}

/**
 * The wavy string-of-sparkles motif lifted from beneath the brand
 * wordmark. Used as a section divider / underline accent throughout the
 * site instead of a plain <hr> — this is the one signature element the
 * design repeats deliberately.
 */
export function Squiggle({ className, tone = "mixed" }: SquiggleProps) {
  const sparkleColors =
    tone === "denim"
      ? ["var(--color-denim)", "var(--color-denim)", "var(--color-denim)"]
      : tone === "bloom"
        ? ["var(--color-bloom)", "var(--color-bloom)", "var(--color-bloom)"]
        : ["var(--color-bloom)", "var(--color-denim)", "var(--color-bloom)"];

  return (
    <svg
      viewBox="0 0 240 24"
      className={cn("h-4 w-32", className)}
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M4 12c8-10 16-10 24 0s16 10 24 0 16-10 24 0 16 10 24 0 16-10 24 0 16 10 24 0 16-10 24 0 16 10 24 0 16-10 24 0"
        stroke="var(--color-denim)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <circle cx="40" cy="5" r="2.5" fill={sparkleColors[0]} />
      <circle cx="110" cy="19" r="2" fill={sparkleColors[1]} />
      <circle cx="170" cy="5" r="2.5" fill={sparkleColors[2]} />
      <path d="M75 3l1.4 3.2L80 7.7l-3.6 1.5L75 12.4l-1.4-3.2L70 7.7l3.6-1.5L75 3z" fill="var(--color-bloom)" />
      <path d="M200 15l1.2 2.8 2.8 1.3-2.8 1.2-1.2 2.9-1.3-2.9-2.8-1.2 2.8-1.3 1.3-2.8z" fill="var(--color-denim)" />
    </svg>
  );
}
