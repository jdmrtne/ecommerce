import { useParams } from "react-router-dom";
import { NotFoundPanel } from "@/pages/NotFound";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { NOT_FOUND } from "@/content/notFound";
import { POLICY_PAGES, type PolicySlug } from "@/content/policies";
import { resolvePolicyDocument } from "@/lib/policySettingsStore";
import { useSiteMeta } from "@/hooks/useSiteMeta";

/**
 * Generic policy page, routed at `/policies/:slug` (Phase 13). One
 * component serves every policy document in `content/policies.ts`'s
 * `POLICY_PAGES` registry - adding a new policy only needs a new
 * `PolicyDocument` + registry entry + footer link, never a new page
 * component or route.
 *
 * Reads through Phase 23's `resolvePolicyDocument()` rather than the
 * static `POLICY_PAGES` export directly, so a Policy Editor save is
 * reflected the next time this route is visited - no reload needed, since
 * the admin/storefront route trees are separate and this page always
 * mounts fresh (see Phase 18 Homepage Editor precedent in
 * `MASTER_HANDOFF.md` for why a plain resolver call, not a reactive hook,
 * is the right shape here). `POLICY_PAGES` itself is still imported only
 * to validate the slug against the known, fixed set of four.
 */
export function Policy() {
  const { slug = "" } = useParams<{ slug: string }>();
  const isKnownSlug = slug in POLICY_PAGES;
  const doc = isKnownSlug ? resolvePolicyDocument(slug as PolicySlug) : undefined;

  useSiteMeta({
    title: doc?.title ?? NOT_FOUND.title,
    description: doc ? undefined : NOT_FOUND.description,
  });

  if (!doc) return <NotFoundPanel />;

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <SectionHeading
        eyebrow="Policies"
        title={doc.title}
        description={`Last updated ${doc.lastUpdated}`}
        align="left"
      />

      <div className="mt-10 flex flex-col gap-8">
        {doc.sections.map((section) => (
          <div key={section.heading}>
            <h2 className="mb-2 text-lg font-semibold text-ink">{section.heading}</h2>
            <p className="text-ink-soft">{section.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
