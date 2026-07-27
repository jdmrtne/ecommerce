import { Squiggle } from "@/components/ui/Squiggle";
import { CategoryMosaic } from "@/components/ui/CategoryMosaic";
import { ABOUT_STORY } from "@/content/about";
import type { SectionOverrideProps } from "@/types/layout";
import { backgroundClass, paddingClass, resolveSectionSettings, widthClass } from "@/lib/sectionStyle";
import { cn } from "@/lib/cn";

const DEFAULT_SETTINGS = { padding: "lg", background: "transparent", width: "default", align: "left" } as const;

/**
 * Origin-story section for `/about`. Keeps `id="story"` - the footer's
 * "Our Story" link (`config/navigation.ts`) points to `/about#story`, so
 * this id must stay put regardless of where the layout config places
 * this section.
 */
export function AboutStorySection({ title, subtitle, settings }: SectionOverrideProps) {
  const s = resolveSectionSettings(DEFAULT_SETTINGS, settings);

  return (
    <section
      id="story"
      className={cn("mx-auto px-4 sm:px-6 lg:px-8", paddingClass(s), backgroundClass(s), widthClass(s))}
    >
      <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <CategoryMosaic />

        <div>
          <span className="mb-2 inline-block text-xs font-bold uppercase tracking-[0.15em] text-bloom-deep">
            {ABOUT_STORY.eyebrow}
          </span>
          <h2 className="font-display text-3xl text-ink sm:text-4xl">{title ?? ABOUT_STORY.title}</h2>
          <Squiggle className="my-5" />
          <p className="text-ink-soft">{subtitle ?? ABOUT_STORY.body}</p>
        </div>
      </div>
    </section>
  );
}
