import { PAGE_META } from "@/config/site";
import { useSiteMeta } from "@/hooks/useSiteMeta";
import { SECTION_REGISTRY } from "@/config/sectionRegistry";
import { ABOUT_LAYOUT } from "@/config/layouts/about";
import { resolveLayoutSections } from "@/types/layout";

/**
 * `/about`, rendered from `config/layouts/about.ts` the same way
 * `pages/Home.tsx` renders from `config/layouts/home.ts` (Phase 11).
 * Real copy still lives in `content/about.ts` - this file only decides
 * which sections appear and in what order.
 */
export function About() {
  useSiteMeta(PAGE_META.about);

  const sections = resolveLayoutSections(ABOUT_LAYOUT);

  return (
    <div className="animate-fade-up">
      {sections.map(({ key, title, subtitle, settings }) => {
        const Section = SECTION_REGISTRY[key];
        return <Section key={key} title={title} subtitle={subtitle} settings={settings} />;
      })}
    </div>
  );
}
