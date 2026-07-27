import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Squiggle } from "@/components/ui/Squiggle";
import { ABOUT_CTA } from "@/content/about";
import type { SectionOverrideProps } from "@/types/layout";
import { backgroundClass, paddingClass, resolveSectionSettings, widthClass } from "@/lib/sectionStyle";
import { cn } from "@/lib/cn";

const DEFAULT_SETTINGS = { padding: "lg", background: "denim-tint", width: "narrow", align: "center" } as const;

export function AboutCtaSection({ title, settings }: SectionOverrideProps) {
  const s = resolveSectionSettings(DEFAULT_SETTINGS, settings);

  return (
    <section className={cn(paddingClass(s), backgroundClass(s), "text-center")}>
      <div className={cn("mx-auto px-4 sm:px-6 lg:px-8", widthClass(s))}>
        <h2 className="font-display text-3xl text-ink sm:text-4xl">{title ?? ABOUT_CTA.title}</h2>
        <Squiggle className="mx-auto my-4" />
        <Link to="/shop">
          <Button size="lg">{ABOUT_CTA.buttonLabel}</Button>
        </Link>
      </div>
    </section>
  );
}
