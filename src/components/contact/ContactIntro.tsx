import { SectionHeading } from "@/components/ui/SectionHeading";
import { CONTACT_INTRO } from "@/content/contact";
import type { SectionOverrideProps } from "@/types/layout";
import { backgroundClass, paddingClass, resolveSectionSettings, widthClass } from "@/lib/sectionStyle";
import { cn } from "@/lib/cn";

const DEFAULT_SETTINGS = { padding: "lg", background: "transparent", width: "medium", align: "center" } as const;

/** Heading block above the /contact info + form grid. Split out of `Contact.tsx` (Phase 11) so it's independently configurable/reorderable. */
export function ContactIntro({ title, subtitle, settings }: SectionOverrideProps) {
  const s = resolveSectionSettings(DEFAULT_SETTINGS, settings);

  return (
    <section className={cn("mx-auto px-4 sm:px-6 lg:px-8", paddingClass(s), backgroundClass(s), widthClass(s))}>
      <SectionHeading
        eyebrow={CONTACT_INTRO.eyebrow}
        title={title ?? CONTACT_INTRO.title}
        description={subtitle ?? CONTACT_INTRO.description}
        align={s.align}
      />
    </section>
  );
}
