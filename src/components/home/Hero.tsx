import { Link } from "react-router-dom";
import { Gem, Heart, Flame, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Squiggle } from "@/components/ui/Squiggle";
import { HERO } from "@/content/homepage";
import type { SectionOverrideProps } from "@/types/layout";
import { backgroundClass, paddingClass, resolveSectionSettings, widthClass } from "@/lib/sectionStyle";
import { cn } from "@/lib/cn";
import { useThemeSettings } from "@/hooks/useThemeSettings";

/** This section's look before Phase 11 - used whenever a layout doesn't override `settings`. */
const ILLUSTRATED_DEFAULT_SETTINGS = { padding: "lg", background: "transparent", width: "default", align: "left" } as const;
/** Phase 12 default for the `bold` hero style - centered, taller, tinted background block. */
const BOLD_DEFAULT_SETTINGS = { padding: "xl", background: "beige", width: "medium", align: "center" } as const;
/** Phase 12 default for the `minimal` hero style - tight, quiet, no side illustration. */
const MINIMAL_DEFAULT_SETTINGS = { padding: "md", background: "transparent", width: "default", align: "left" } as const;

/**
 * Above-the-fold hero. `title` overrides only the first headline line (the
 * accent second line stays content-driven); `subtitle` overrides the
 * subheadline. Both are optional per-layout overrides on top of
 * `content/homepage.ts`.
 *
 * Phase 12: which of the three variants below renders is controlled by the
 * active preset's `heroStyle` (`config/presets/`), not a prop - `illustrated`
 * (the original Phase 1-11 layout: text left, three floating "blob" pieces
 * right - the template's one deliberate visual risk, echoing the CraftIcon
 * motif used later on the page), `bold` (centered, large type, tinted
 * background block, no side visual), or `minimal` (left-aligned, quiet,
 * single primary CTA, no blobs or squiggle). All three read the same
 * `HERO` content and `title`/`subtitle`/`settings` overrides.
 */
export function Hero({ title, subtitle, settings }: SectionOverrideProps) {
  const heroStyle = useThemeSettings().activePreset.heroStyle;

  if (heroStyle === "bold") {
    const s = resolveSectionSettings(BOLD_DEFAULT_SETTINGS, settings);
    return (
      <section className={cn("relative overflow-hidden text-center", backgroundClass(s))}>
        <div className={cn("mx-auto animate-fade-up px-4 sm:px-6 lg:px-8", paddingClass(s), widthClass(s))}>
          <span className="mb-4 inline-block text-xs font-bold uppercase tracking-[0.15em] text-bloom-deep">
            {HERO.eyebrow}
          </span>
          <h1 className="font-display text-5xl leading-[1.05] text-ink sm:text-6xl lg:text-7xl">
            {title ?? HERO.headlineLine1}
            <br />
            <span className="text-denim">{HERO.headlineLine2}</span>
          </h1>
          <Squiggle className="mx-auto my-6" />
          <p className="mx-auto max-w-xl text-lg text-ink-soft">{subtitle ?? HERO.subheadline}</p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link to={HERO.ctaPrimaryTo}>
              <Button size="lg">{HERO.ctaPrimaryLabel}</Button>
            </Link>
            <Link to={HERO.ctaSecondaryTo}>
              <Button size="lg" variant="outline">
                {HERO.ctaSecondaryLabel}
              </Button>
            </Link>
          </div>
        </div>
      </section>
    );
  }

  if (heroStyle === "minimal") {
    const s = resolveSectionSettings(MINIMAL_DEFAULT_SETTINGS, settings);
    return (
      <section className={cn("relative overflow-hidden", backgroundClass(s))}>
        <div className={cn("mx-auto animate-fade-up px-4 sm:px-6 lg:px-8", paddingClass(s), widthClass(s))}>
          <span className="mb-3 inline-block text-xs font-semibold uppercase tracking-[0.15em] text-ink-soft">
            {HERO.eyebrow}
          </span>
          <h1 className="max-w-2xl font-display text-3xl leading-[1.15] text-ink sm:text-4xl lg:text-5xl">
            {title ?? HERO.headlineLine1} {HERO.headlineLine2}
          </h1>
          <p className="mt-4 max-w-md text-base text-ink-soft">{subtitle ?? HERO.subheadline}</p>
          <div className="mt-6 flex flex-wrap items-center gap-5">
            <Link to={HERO.ctaPrimaryTo}>
              <Button>{HERO.ctaPrimaryLabel}</Button>
            </Link>
            <Link
              to={HERO.ctaSecondaryTo}
              className="text-sm font-semibold text-ink underline underline-offset-4 transition-colors hover:text-denim"
            >
              {HERO.ctaSecondaryLabel}
            </Link>
          </div>
        </div>
      </section>
    );
  }

  // "illustrated" - the original Phase 1-11 layout.
  const s = resolveSectionSettings(ILLUSTRATED_DEFAULT_SETTINGS, settings);
  return (
    <section className={cn("relative overflow-hidden", backgroundClass(s))}>
      <div
        className={cn(
          "mx-auto grid items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:px-8 lg:py-24",
          paddingClass(s),
          widthClass(s),
        )}
      >
        <div className="animate-fade-up text-center lg:text-left">
          <span className="mb-4 inline-block text-xs font-bold uppercase tracking-[0.15em] text-bloom-deep">
            {HERO.eyebrow}
          </span>
          <h1 className="font-display text-4xl leading-[1.1] text-ink sm:text-5xl lg:text-6xl">
            {title ?? HERO.headlineLine1}
            <br />
            <span className="text-denim">{HERO.headlineLine2}</span>
          </h1>
          <Squiggle className="my-6 mx-auto lg:mx-0" />
          <p className="mx-auto max-w-md text-lg text-ink-soft lg:mx-0">{subtitle ?? HERO.subheadline}</p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
            <Link to={HERO.ctaPrimaryTo}>
              <Button size="lg">{HERO.ctaPrimaryLabel}</Button>
            </Link>
            <Link to={HERO.ctaSecondaryTo}>
              <Button size="lg" variant="outline">
                {HERO.ctaSecondaryLabel}
              </Button>
            </Link>
          </div>
        </div>

        <div
          className="relative mx-auto h-72 w-full max-w-sm sm:h-96 lg:h-[420px] lg:max-w-none"
          aria-hidden="true"
        >
          <FloatingBlob
            className="left-[8%] top-[6%] h-36 w-36 sm:h-44 sm:w-44"
            fill="var(--color-bloom-tint)"
            iconColor="var(--color-bloom)"
            Icon={Gem}
            delay="0s"
          />
          <FloatingBlob
            className="right-[6%] top-[18%] h-28 w-28 sm:h-36 sm:w-36"
            fill="var(--color-denim-tint)"
            iconColor="var(--color-denim)"
            Icon={Heart}
            delay="1.2s"
          />
          <FloatingBlob
            className="bottom-[8%] left-[22%] h-32 w-32 sm:h-40 sm:w-40"
            fill="var(--color-bloom-tint)"
            iconColor="var(--color-bloom-deep)"
            Icon={Flame}
            delay="2.1s"
          />
          <Sparkles
            className="absolute right-[18%] bottom-[4%] text-denim/70"
            size={28}
            strokeWidth={1.5}
          />
          <Sparkles
            className="absolute left-[2%] bottom-[38%] text-bloom/70"
            size={20}
            strokeWidth={1.5}
          />
        </div>
      </div>
    </section>
  );
}

function FloatingBlob({
  className,
  fill,
  iconColor,
  Icon,
  delay,
}: {
  className: string;
  fill: string;
  iconColor: string;
  Icon: typeof Gem;
  delay: string;
}) {
  return (
    <div
      className={`absolute flex items-center justify-center animate-float motion-reduce:animate-none ${className}`}
      style={{ animationDelay: delay }}
    >
      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full drop-shadow-[0_8px_20px_rgba(74,54,40,0.12)]">
        <path
          d="M50 6c15 0 24 10 32 20s16 20 8 34-24 20-40 20-32-8-38-24S6 26 20 14 35 6 50 6Z"
          fill={fill}
        />
      </svg>
      <Icon size={36} color={iconColor} strokeWidth={1.6} className="relative" />
    </div>
  );
}
