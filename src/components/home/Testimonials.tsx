import { Star, Quote } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { useInView } from "@/hooks/useInView";
import { TESTIMONIALS, TESTIMONIALS_SECTION } from "@/content/homepage";
import type { SectionOverrideProps } from "@/types/layout";
import { backgroundClass, paddingClass, resolveSectionSettings, widthClass } from "@/lib/sectionStyle";
import { cn } from "@/lib/cn";

const DEFAULT_SETTINGS = { padding: "lg", background: "beige", width: "default", align: "center" } as const;

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function Testimonials({ title, settings }: SectionOverrideProps) {
  const { ref, isInView } = useInView<HTMLDivElement>();
  const s = resolveSectionSettings(DEFAULT_SETTINGS, settings);

  return (
    <section className={cn(paddingClass(s), backgroundClass(s))}>
      <div className={cn("mx-auto px-4 sm:px-6 lg:px-8", widthClass(s))}>
        <SectionHeading eyebrow={TESTIMONIALS_SECTION.eyebrow} title={title ?? TESTIMONIALS_SECTION.title} align={s.align} />

        <div ref={ref} className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {TESTIMONIALS.map((testimonial, i) => (
            <Card
              key={testimonial.id}
              padding="lg"
              className={isInView ? "animate-fade-up flex flex-col gap-4" : "flex flex-col gap-4 opacity-0"}
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <Quote className="text-bloom/60" size={28} strokeWidth={1.5} />
              <p className="flex-1 text-ink-soft">&ldquo;{testimonial.quote}&rdquo;</p>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-denim-tint text-sm font-bold text-denim-deep">
                  {initials(testimonial.name)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-ink">{testimonial.name}</p>
                  <p className="text-xs text-ink-soft">{testimonial.location}</p>
                </div>
                <div className="ml-auto flex gap-0.5" aria-label={`${testimonial.rating} out of 5 stars`}>
                  {Array.from({ length: 5 }).map((_, starIndex) => (
                    <Star
                      key={starIndex}
                      size={14}
                      className={starIndex < testimonial.rating ? "fill-bloom text-bloom" : "text-beige-dark"}
                    />
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
