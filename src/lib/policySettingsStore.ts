import { POLICY_PAGES, type PolicyDocument, type PolicySlug } from "@/content/policies";
import { storageKey } from "@/config/branding";

/**
 * Phase 23 - Policy Editor. Same override-over-defaults pattern as every
 * prior editor: persist edits as a `localStorage` override, resolved over
 * a static default at read time rather than replacing it outright.
 *
 * `content/policies.ts`'s `POLICY_PAGES` is a fixed, closed set of four
 * known slugs (`privacy`/`terms`/`shipping`/`returns`) - there's no admin
 * flow to add a fifth policy page or remove one of the four, only to edit
 * their content - so unlike Phase 19/20's id-keyed map (built for a
 * *growable* list of records with creation/deletion), the override here is
 * simply `Partial<Record<PolicySlug, PolicyDocument>>`: at most one full
 * replacement `PolicyDocument` per known slug, keyed by that slug. A slug
 * with no entry in the override resolves to its static default; there is
 * no deletion sentinel because "removing" a policy isn't a supported
 * action - reverting one slug back to its default is `resetPolicyOverride`
 * below, not a delete.
 *
 * Each `PolicyDocument` holds a title, a last-updated date string, and an
 * ordered list of `{ heading, body }` sections - the "structured
 * multi-paragraph fields" the Phase 23 brief asks for. `PolicyEditor.tsx`
 * edits one slug's document at a time (title/date/sections, with
 * add/remove/reorder on the section list, mirroring Phase 21/22's
 * whole-array-as-one-field approach one level inside a single record
 * rather than across a whole record list) and saves the complete
 * replacement document for that slug.
 */

const POLICY_SLUGS: PolicySlug[] = ["privacy", "terms", "shipping", "returns"];

export type PolicySettingsOverride = Partial<Record<PolicySlug, PolicyDocument>>;

const STORAGE_KEY = storageKey("policy-settings");

/** Dispatched on `window` whenever the override is saved or reset - same-tab reactivity for `usePolicySettings()`. */
export const POLICY_SETTINGS_CHANGE_EVENT = "policysettingschange";

function isPolicyDocument(value: unknown): value is PolicyDocument {
  if (typeof value !== "object" || value === null) return false;
  const doc = value as Partial<PolicyDocument>;
  if (typeof doc.title !== "string") return false;
  if (typeof doc.lastUpdated !== "string") return false;
  if (!Array.isArray(doc.sections)) return false;
  return doc.sections.every(
    (section) =>
      typeof section === "object" &&
      section !== null &&
      typeof (section as { heading?: unknown }).heading === "string" &&
      typeof (section as { body?: unknown }).body === "string",
  );
}

/** Reads the raw saved override, defensively - never throws, never returns partial garbage. */
export function getPolicySettingsOverride(): PolicySettingsOverride {
  if (typeof window === "undefined") return {};
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return {};
    const parsed = JSON.parse(stored) as unknown;
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return {};

    const result: PolicySettingsOverride = {};
    for (const slug of POLICY_SLUGS) {
      const value = (parsed as Record<string, unknown>)[slug];
      if (value === undefined) continue;
      if (!isPolicyDocument(value)) return {};
      result[slug] = value;
    }
    return result;
  } catch {
    return {};
  }
}

function notifyChange() {
  window.dispatchEvent(new Event(POLICY_SETTINGS_CHANGE_EVENT));
}

function persist(override: PolicySettingsOverride) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(override));
  notifyChange();
}

/** Saves a complete replacement document for one slug, merged over any other slugs' existing overrides. */
export function savePolicyOverride(slug: PolicySlug, doc: PolicyDocument): void {
  if (typeof window === "undefined") return;
  const current = getPolicySettingsOverride();
  persist({ ...current, [slug]: doc });
}

/** Clears one slug's override, reverting just that policy back to its static default. */
export function resetPolicyOverride(slug: PolicySlug): void {
  if (typeof window === "undefined") return;
  const current = getPolicySettingsOverride();
  const next = { ...current };
  delete next[slug];
  persist(next);
}

/** Clears every slug's override, reverting all four policies back to their static defaults. */
export function resetPolicySettingsOverride(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
  notifyChange();
}

/** Resolves the live document for one slug: the saved override if one exists, else the static `POLICY_PAGES` default. */
export function resolvePolicyDocument(slug: PolicySlug): PolicyDocument {
  const override = getPolicySettingsOverride();
  return override[slug] ?? POLICY_PAGES[slug];
}

/** Resolves the live documents for every known slug, in `content/policies.ts`'s registry order. */
export function resolvePolicyPages(): Record<PolicySlug, PolicyDocument> {
  const override = getPolicySettingsOverride();
  const result = {} as Record<PolicySlug, PolicyDocument>;
  for (const slug of POLICY_SLUGS) {
    result[slug] = override[slug] ?? POLICY_PAGES[slug];
  }
  return result;
}

export { POLICY_SLUGS };
