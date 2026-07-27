import { PAGE_META } from "@/config/site";
import { useSiteMeta } from "@/hooks/useSiteMeta";
import { SECTION_REGISTRY } from "@/config/sectionRegistry";
import { CONTACT_LAYOUT } from "@/config/layouts/contact";
import { resolveLayoutSections } from "@/types/layout";

/**
 * `/contact`, rendered from `config/layouts/contact.ts` (Phase 11) - same
 * section-registry pattern as Home/About. `content/contact.ts` still owns
 * the actual copy and contact-point data.
 */
export function Contact() {
  useSiteMeta(PAGE_META.contact);

  const sections = resolveLayoutSections(CONTACT_LAYOUT);

  return (
    <div>
      {sections.map(({ key, title, subtitle, settings }) => {
        const Section = SECTION_REGISTRY[key];
        return <Section key={key} title={title} subtitle={subtitle} settings={settings} />;
      })}
    </div>
  );
}
