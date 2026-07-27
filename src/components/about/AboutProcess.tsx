import { Card } from "@/components/ui/Card";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ICON_REGISTRY } from "@/lib/iconRegistry";
import { PROCESS_STEPS, PROCESS_SECTION } from "@/content/about";
import type { SectionOverrideProps } from "@/types/layout";
import { backgroundClass, paddingClass, resolveSectionSettings, widthClass } from "@/lib/sectionStyle";
import { cn } from "@/lib/cn";

const DEFAULT_SETTINGS = { padding: "lg", background: "beige", width: "default", align: "center" } as const;

/**
 * "How each piece comes together" process steps. Previously hardcoded its
 * heading copy directly in `About.tsx` instead of reading
 * `PROCESS_SECTION` from `content/about.ts` - fixed as part of this split
 * so the section is fully config/content-driven like every other one.
 */
export function AboutProcess({ title, settings }: SectionOverrideProps) {
  const s = resolveSectionSettings(DEFAULT_SETTINGS, settings);

  return (
    <section className={cn(paddingClass(s), backgroundClass(s))}>
      <div className={cn("mx-auto px-4 sm:px-6 lg:px-8", widthClass(s))}>
        <SectionHeading eyebrow={PROCESS_SECTION.eyebrow} title={title ?? PROCESS_SECTION.title} align={s.align} />
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {PROCESS_STEPS.map(({ icon, title: stepTitle, description }) => {
            const Icon = ICON_REGISTRY[icon] ?? ICON_REGISTRY.Package;
            return (
              <Card key={stepTitle} padding="lg" className="flex flex-col items-center gap-3 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-denim-tint">
                  <Icon size={22} className="text-denim" strokeWidth={1.6} />
                </div>
                <h3 className="font-semibold text-ink">{stepTitle}</h3>
                <p className="text-sm text-ink-soft">{description}</p>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
