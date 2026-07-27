import { Squiggle } from "@/components/ui/Squiggle";

interface PagePlaceholderProps {
  title: string;
  phase: string;
}

/**
 * Temporary content for routes whose real content ships in a later phase
 * (Phase 2: Homepage, Phase 3: Shop, etc). Confirms routing + layout work
 * end-to-end without building ahead of the current phase.
 */
export function PagePlaceholder({ title, phase }: PagePlaceholderProps) {
  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center px-6 py-28 text-center animate-fade-up">
      <h1 className="font-display text-4xl text-ink">{title}</h1>
      <Squiggle className="my-5" />
      <p className="text-ink-soft">
        This page's content is built in <span className="font-semibold text-denim">{phase}</span>.
        The layout, navigation, and design system around it are already live.
      </p>
    </div>
  );
}
