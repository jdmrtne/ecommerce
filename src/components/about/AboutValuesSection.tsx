import { Card } from "@/components/ui/Card";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ABOUT_VALUES, VALUES_SECTION } from "@/content/about";
import type { SectionOverrideProps } from "@/types/layout";
import { backgroundClass, paddingClass, resolveSectionSettings, widthClass } from "@/lib/sectionStyle";
import { cn } from "@/lib/cn";

const DEFAULT_SETTINGS = { padding: "lg", background: "transparent", width: "default", align: "center" } as const;

export function AboutValuesSection({ title, settings }: SectionOverrideProps) {
  const s = resolveSectionSettings(DEFAULT_SETTINGS, settings);

  return (
    <section className={cn("mx-auto px-4 sm:px-6 lg:px-8", paddingClass(s), backgroundClass(s), widthClass(s))}>
      <SectionHeading eyebrow={VALUES_SECTION.eyebrow} title={title ?? VALUES_SECTION.title} align={s.align} />
      <div className="mt-10 grid gap-6 sm:grid-cols-3">
        {ABOUT_VALUES.map((value) => (
          <Card key={value.title} padding="lg">
            <h3 className="font-display text-lg text-ink">{value.title}</h3>
            <p className="mt-2 text-sm text-ink-soft">{value.description}</p>
          </Card>
        ))}
      </div>
    </section>
  );
}
