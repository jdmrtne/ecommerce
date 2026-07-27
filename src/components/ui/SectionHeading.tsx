import { Squiggle } from "@/components/ui/Squiggle";
import { cn } from "@/lib/cn";

interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "center" | "left";
  className?: string;
}

/**
 * Shared heading block for homepage sections: small caps eyebrow, display
 * heading, squiggle underline, optional supporting copy. Keeps section
 * intros consistent instead of each section inventing its own header.
 */
export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "flex flex-col",
        align === "center" ? "items-center text-center" : "items-start text-left",
        className,
      )}
    >
      {eyebrow && (
        <span className="mb-2 text-xs font-bold uppercase tracking-[0.15em] text-bloom-deep">
          {eyebrow}
        </span>
      )}
      <h2 className="font-display text-3xl text-ink sm:text-4xl">{title}</h2>
      <Squiggle className="my-4" />
      {description && (
        <p className={cn("text-ink-soft", align === "center" ? "max-w-xl" : "max-w-xl")}>
          {description}
        </p>
      )}
    </div>
  );
}
