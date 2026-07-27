/**
 * Builds a page's full `<title>` from the business name/tagline and an
 * optional page-specific title. Pulled out as a standalone, asset-free
 * function (Phase 13) so it can be shared by `config/site.ts` (used at
 * runtime by `useSiteMeta`) and `scripts/sync-index-html.mjs` (used at
 * build time for `index.html`'s static tags) - the two page-title
 * formats can never drift apart.
 */
export function buildTitle(businessName: string, tagline: string, pageTitle: string): string {
  return pageTitle ? `${pageTitle} | ${businessName}` : `${businessName} | ${tagline}`;
}
