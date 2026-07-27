import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Squiggle } from "@/components/ui/Squiggle";
import { CategoryMosaic } from "@/components/ui/CategoryMosaic";
import { useInView } from "@/hooks/useInView";
import { ABOUT_PREVIEW } from "@/content/homepage";
import type { SectionOverrideProps } from "@/types/layout";
import { backgroundClass, paddingClass, resolveSectionSettings, widthClass } from "@/lib/sectionStyle";
import { cn } from "@/lib/cn";

const DEFAULT_SETTINGS = { padding: "lg", background: "transparent", width: "default", align: "left" } as const;

export function AboutBrand({ title, subtitle, settings }: SectionOverrideProps) {
  const { ref, isInView } = useInView<HTMLDivElement>();
  const s = resolveSectionSettings(DEFAULT_SETTINGS, settings);

  return (
    <section
      id="story"
      ref={ref}
      className={cn("mx-auto px-4 sm:px-6 lg:px-8", paddingClass(s), backgroundClass(s), widthClass(s))}
    >
      <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <div className={isInView ? "animate-fade-up order-2 lg:order-1" : "order-2 opacity-0 lg:order-1"}>
          <CategoryMosaic />
        </div>

        <div className="order-1 text-center lg:order-2 lg:text-left">
          <span className="mb-2 inline-block text-xs font-bold uppercase tracking-[0.15em] text-bloom-deep">
            {ABOUT_PREVIEW.eyebrow}
          </span>
          <h2 className="font-display text-3xl text-ink sm:text-4xl">{title ?? ABOUT_PREVIEW.title}</h2>
          <Squiggle className="my-5 mx-auto lg:mx-0" />
          <p className="mx-auto max-w-md text-ink-soft lg:mx-0">{subtitle ?? ABOUT_PREVIEW.description}</p>
          <Link to={ABOUT_PREVIEW.ctaTo} className="mt-6 inline-block">
            <Button variant="outline">{ABOUT_PREVIEW.ctaLabel}</Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
