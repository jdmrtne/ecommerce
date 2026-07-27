import { Squiggle } from "@/components/ui/Squiggle";
import { ABOUT_HERO } from "@/content/about";
import type { SectionOverrideProps } from "@/types/layout";
import { backgroundClass, paddingClass, resolveSectionSettings, widthClass } from "@/lib/sectionStyle";
import { cn } from "@/lib/cn";

const DEFAULT_SETTINGS = { padding: "lg", background: "transparent", width: "narrow", align: "center" } as const;

/** Above-the-fold intro block for `/about`. Split out of the page (Phase 11) so it can be reused/reordered/hidden via `config/layouts/about.ts`. */
export function AboutIntro({ title, subtitle, settings }: SectionOverrideProps) {
  const s = resolveSectionSettings(DEFAULT_SETTINGS, settings);

  return (
    <section
      className={cn(
        "mx-auto px-4 text-center sm:px-6 lg:px-8",
        paddingClass(s),
        backgroundClass(s),
        widthClass(s),
      )}
    >
      <span className="mb-2 inline-block text-xs font-bold uppercase tracking-[0.15em] text-bloom-deep">
        {ABOUT_HERO.eyebrow}
      </span>
      <h1 className="font-display text-4xl text-ink sm:text-5xl">{title ?? ABOUT_HERO.title}</h1>
      <Squiggle className="mx-auto my-5" />
      <p className="text-ink-soft">{subtitle ?? ABOUT_HERO.body}</p>
    </section>
  );
}
