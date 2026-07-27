import { PAGE_META } from "@/config/site";
import { useSiteMeta } from "@/hooks/useSiteMeta";
import { SECTION_REGISTRY } from "@/config/sectionRegistry";
import { resolveHomeLayout } from "@/lib/homepageSettingsStore";
import { resolveLayoutSections } from "@/types/layout";

/**
 * The homepage is a rendering engine, not a fixed page: it resolves the
 * active layout (`resolveHomeLayout()`, Phase 18 - a saved Homepage
 * Editor override layered over `config/layouts/home.ts`'s static
 * default), keeps only the enabled sections, sorts them by `order`, and
 * renders each one from `config/sectionRegistry.tsx` with that instance's
 * `title`/`subtitle`/`settings` overrides. Every layout shares the same
 * section components - switching templates (or defining a new one) never
 * requires touching this file or any section component.
 */
export function Home() {
  useSiteMeta(PAGE_META.home);

  const layout = resolveHomeLayout();
  const sections = resolveLayoutSections(layout);

  return (
    <>
      {sections.map(({ key, title, subtitle, settings }) => {
        const Section = SECTION_REGISTRY[key];
        return <Section key={key} title={title} subtitle={subtitle} settings={settings} />;
      })}
    </>
  );
}
