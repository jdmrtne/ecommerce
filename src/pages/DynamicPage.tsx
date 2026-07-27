import { NotFoundPanel } from "@/pages/NotFound";
import { NOT_FOUND } from "@/content/notFound";
import { useSiteMeta } from "@/hooks/useSiteMeta";
import { SECTION_REGISTRY } from "@/config/sectionRegistry";
import { resolveLayoutSections } from "@/types/layout";
import { DYNAMIC_PAGES } from "@/config/layouts/pages";

interface DynamicPageProps {
  /** Key into `DYNAMIC_PAGES` (`config/layouts/pages/`), passed by the route that mounts this page. */
  slug: string;
}

/**
 * Generic route component for every standalone dynamic page (Phase 14).
 * Looks its page definition up in `DYNAMIC_PAGES` by `slug`, then renders
 * that definition's enabled sections through `SECTION_REGISTRY` - exactly
 * the same rendering-engine pattern `Home.tsx`/`About.tsx`/`Contact.tsx`
 * use for their own fixed section sets (Phase 11), generalized so it
 * works for any page, not just those three.
 *
 * A missing/misconfigured slug (i.e. a route wired to a definition that
 * isn't in the registry) falls back to the shared `NotFoundPanel`, the
 * same panel `pages/Policy.tsx` uses for an unknown policy slug.
 */
export function DynamicPage({ slug }: DynamicPageProps) {
  const page = DYNAMIC_PAGES[slug];

  useSiteMeta(page ? page.meta : { title: NOT_FOUND.title, description: NOT_FOUND.description });

  if (!page) return <NotFoundPanel />;

  const sections = resolveLayoutSections(page);

  return (
    <div className="animate-fade-up">
      {sections.map(({ key, title, subtitle, settings }) => {
        const Section = SECTION_REGISTRY[key];
        return <Section key={key} title={title} subtitle={subtitle} settings={settings} />;
      })}
    </div>
  );
}
