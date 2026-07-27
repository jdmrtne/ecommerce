import { Link } from "react-router-dom";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { getContactPoints } from "@/content/contact";
import { CONTACT_TEASER } from "@/content/homepage";
import type { SectionOverrideProps } from "@/types/layout";
import { backgroundClass, paddingClass, resolveSectionSettings, widthClass } from "@/lib/sectionStyle";
import { cn } from "@/lib/cn";
import { useStoreSettings } from "@/hooks/useStoreSettings";

const DEFAULT_SETTINGS = { padding: "lg", background: "beige", width: "medium", align: "center" } as const;

export function ContactTeaser({ title, subtitle, settings }: SectionOverrideProps) {
  const s = resolveSectionSettings(DEFAULT_SETTINGS, settings);
  const { business } = useStoreSettings();
  const contactPoints = getContactPoints(business);

  return (
    <section id="contact" className={cn(paddingClass(s), backgroundClass(s))}>
      <div className={cn("mx-auto px-4 text-center sm:px-6 lg:px-8", widthClass(s))}>
        <SectionHeading
          eyebrow={CONTACT_TEASER.eyebrow}
          title={title ?? CONTACT_TEASER.title}
          description={subtitle ?? CONTACT_TEASER.description}
        />

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {contactPoints.map(({ icon: Icon, label, value, href }) => (
            <Card key={label} padding="lg" className="flex flex-col items-center gap-2 text-center">
              <Icon className="text-denim" size={24} strokeWidth={1.6} />
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">{label}</p>
              {href ? (
                <a
                  href={href}
                  className="font-semibold text-ink hover:text-denim"
                  target={href.startsWith("http") ? "_blank" : undefined}
                  rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
                >
                  {value}
                </a>
              ) : (
                <p className="font-semibold text-ink">{value}</p>
              )}
            </Card>
          ))}
        </div>

        <Link to="/contact" className="mt-8 inline-block">
          <Button>{CONTACT_TEASER.ctaLabel}</Button>
        </Link>
      </div>
    </section>
  );
}
