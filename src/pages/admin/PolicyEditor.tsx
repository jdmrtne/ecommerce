import { useState } from "react";
import type { FormEvent } from "react";
import { Check, Plus, Trash2, RotateCcw, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input, Textarea } from "@/components/ui/Input";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { cn } from "@/lib/cn";
import type { PolicyDocument, PolicySlug } from "@/content/policies";
import { POLICY_SLUGS, resolvePolicyDocument } from "@/lib/policySettingsStore";
import { usePolicySettings } from "@/hooks/usePolicySettings";
import { hasPolicyDocumentErrors, validatePolicyDocument } from "@/lib/policyValidation";
import type { PolicyDocumentFormErrors } from "@/lib/policyValidation";
import { PAGE_META } from "@/config/site";
import { useSiteMeta } from "@/hooks/useSiteMeta";

const SLUG_LABELS: Record<PolicySlug, string> = {
  privacy: "Privacy",
  terms: "Terms",
  shipping: "Shipping",
  returns: "Returns",
};

function cloneDocument(doc: PolicyDocument): PolicyDocument {
  return { title: doc.title, lastUpdated: doc.lastUpdated, sections: doc.sections.map((s) => ({ ...s })) };
}

const EMPTY_ERRORS: PolicyDocumentFormErrors = { sectionErrors: [] };

/**
 * Phase 23 - Policy Editor. Admin UI over `content/policies.ts`'s four
 * known policy documents (`POLICY_PAGES`), via
 * `lib/policySettingsStore.ts`/`hooks/usePolicySettings.ts` - the same
 * override-over-defaults pattern as every prior editor, applied to a
 * fixed, non-growable set of records rather than a list.
 *
 * One policy is edited at a time, selected with a small tab-like button
 * row (mirroring the preset-picker style from `ThemeEditor.tsx`). Editing
 * one policy's title, last-updated date, or sections never touches the
 * other three - each is saved and reset independently, plus an "all
 * policies" reset for clearing every override at once.
 */
export function PolicyEditor() {
  useSiteMeta(PAGE_META.adminPolicies);
  const { pages, isOverridden, save, reset, resetAll } = usePolicySettings();

  const [activeSlug, setActiveSlug] = useState<PolicySlug>("privacy");
  const [drafts, setDrafts] = useState<Record<PolicySlug, PolicyDocument>>(() => {
    const initial = {} as Record<PolicySlug, PolicyDocument>;
    for (const slug of POLICY_SLUGS) initial[slug] = cloneDocument(pages[slug]);
    return initial;
  });
  const [errors, setErrors] = useState<Record<PolicySlug, PolicyDocumentFormErrors>>({
    privacy: EMPTY_ERRORS,
    terms: EMPTY_ERRORS,
    shipping: EMPTY_ERRORS,
    returns: EMPTY_ERRORS,
  });
  const [savedSlug, setSavedSlug] = useState<PolicySlug | null>(null);

  const doc = drafts[activeSlug];
  const docErrors = errors[activeSlug];

  function updateDoc(updater: (doc: PolicyDocument) => PolicyDocument) {
    setDrafts((prev) => ({ ...prev, [activeSlug]: updater(prev[activeSlug]) }));
    setSavedSlug(null);
  }

  function updateSectionField(index: number, field: "heading" | "body", value: string) {
    updateDoc((prev) => ({
      ...prev,
      sections: prev.sections.map((section, i) => (i === index ? { ...section, [field]: value } : section)),
    }));
  }

  function addSection() {
    updateDoc((prev) => ({ ...prev, sections: [...prev.sections, { heading: "", body: "" }] }));
  }

  function removeSection(index: number) {
    updateDoc((prev) => ({ ...prev, sections: prev.sections.filter((_, i) => i !== index) }));
  }

  function moveSection(index: number, direction: -1 | 1) {
    updateDoc((prev) => {
      const target = index + direction;
      if (target < 0 || target >= prev.sections.length) return prev;
      const sections = [...prev.sections];
      [sections[index], sections[target]] = [sections[target], sections[index]];
      return { ...prev, sections };
    });
  }

  function handleReset() {
    reset(activeSlug);
    // Same gotcha every prior reset handler has to account for: `pages`
    // here is a render-time value from before `reset()` took effect -
    // re-resolve directly rather than trusting the stale hook value.
    setDrafts((prev) => ({ ...prev, [activeSlug]: cloneDocument(resolvePolicyDocument(activeSlug)) }));
    setErrors((prev) => ({ ...prev, [activeSlug]: EMPTY_ERRORS }));
    setSavedSlug(null);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const trimmed: PolicyDocument = {
      title: doc.title.trim(),
      lastUpdated: doc.lastUpdated.trim(),
      sections: doc.sections.map((section) => ({ heading: section.heading.trim(), body: section.body.trim() })),
    };

    const nextErrors = validatePolicyDocument(trimmed);
    setErrors((prev) => ({ ...prev, [activeSlug]: nextErrors }));
    if (hasPolicyDocumentErrors(nextErrors)) return;

    save(activeSlug, trimmed);
    setDrafts((prev) => ({ ...prev, [activeSlug]: trimmed }));
    setSavedSlug(activeSlug);
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <SectionHeading eyebrow="Admin" title="Policy Editor" align="left" />
        <Button
          type="button"
          variant="outline"
          size="sm"
          icon={<RotateCcw size={16} />}
          onClick={resetAll}
          disabled={POLICY_SLUGS.every((slug) => !isOverridden(slug))}
        >
          Reset all policies
        </Button>
      </div>

      <p className="mt-4 text-sm text-ink-soft">
        Edit the content shown on each policy page, routed at{" "}
        <code className="rounded bg-beige px-1 py-0.5 text-xs">/policies/:slug</code>. Each policy has its
        own title, last-updated date, and an ordered list of sections.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {POLICY_SLUGS.map((slug) => {
          const isSelected = slug === activeSlug;
          return (
            <button
              key={slug}
              type="button"
              onClick={() => setActiveSlug(slug)}
              aria-pressed={isSelected}
              className={cn(
                "flex items-center justify-between gap-2 rounded-lg border-2 px-4 py-3 text-left transition-colors",
                isSelected ? "border-denim bg-denim-tint/40" : "border-beige bg-surface hover:border-denim/40",
              )}
            >
              <span className="font-display text-sm text-ink">{SLUG_LABELS[slug]}</span>
              {isSelected && <Check size={16} className="shrink-0 text-denim" aria-hidden="true" />}
            </button>
          );
        })}
      </div>

      <form onSubmit={handleSubmit} noValidate className="mt-6 flex flex-col gap-6">
        <Card padding="lg" className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Title"
              value={doc.title}
              onChange={(e) => updateDoc((prev) => ({ ...prev, title: e.target.value }))}
              error={docErrors.title}
            />
            <Input
              label="Last updated"
              value={doc.lastUpdated}
              onChange={(e) => updateDoc((prev) => ({ ...prev, lastUpdated: e.target.value }))}
              placeholder="2026-01-01"
              error={docErrors.lastUpdated}
            />
          </div>
        </Card>

        <div className="flex flex-col gap-4" data-testid="policy-section-list">
          {doc.sections.length === 0 ? (
            <Card padding="lg">
              <p className="text-center text-sm text-ink-soft">No sections yet - add one below.</p>
            </Card>
          ) : (
            doc.sections.map((section, index) => {
              const sectionErrors = docErrors.sectionErrors[index] ?? {};
              return (
                <Card key={index} padding="lg" className="flex flex-col gap-4">
                  <div className="flex flex-wrap items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <Input
                        label="Heading"
                        value={section.heading}
                        onChange={(e) => updateSectionField(index, "heading", e.target.value)}
                        error={sectionErrors.heading}
                      />
                    </div>
                    <div className="flex shrink-0 items-center gap-1 pt-7">
                      <button
                        type="button"
                        onClick={() => moveSection(index, -1)}
                        disabled={index === 0}
                        aria-label={`Move ${section.heading || "section"} up`}
                        className="rounded-md border-2 border-beige p-1.5 text-ink-soft transition-colors hover:border-denim/40 hover:text-denim disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-beige disabled:hover:text-ink-soft"
                      >
                        <ArrowUp size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveSection(index, 1)}
                        disabled={index === doc.sections.length - 1}
                        aria-label={`Move ${section.heading || "section"} down`}
                        className="rounded-md border-2 border-beige p-1.5 text-ink-soft transition-colors hover:border-denim/40 hover:text-denim disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-beige disabled:hover:text-ink-soft"
                      >
                        <ArrowDown size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeSection(index)}
                        aria-label={`Remove ${section.heading || "section"}`}
                        className="rounded-md border-2 border-beige p-1.5 text-ink-soft transition-colors hover:border-error/60 hover:text-error"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  <Textarea
                    label="Body"
                    value={section.body}
                    onChange={(e) => updateSectionField(index, "body", e.target.value)}
                    error={sectionErrors.body}
                  />
                </Card>
              );
            })
          )}
          {docErrors.sectionsError && <p className="text-sm text-error">{docErrors.sectionsError}</p>}
        </div>

        <Button type="button" variant="outline" size="sm" icon={<Plus size={16} />} onClick={addSection} className="self-start">
          Add section
        </Button>

        <div className="flex items-center gap-3 border-t border-beige pt-6">
          <Button type="submit">Save changes</Button>
          <Button type="button" variant="ghost" size="sm" onClick={handleReset} disabled={!isOverridden(activeSlug)}>
            Reset this policy
          </Button>
          {savedSlug === activeSlug && (
            <p role="status" className="text-sm font-medium text-denim-deep">
              Saved - changes are live on the policy page.
            </p>
          )}
        </div>
      </form>
    </div>
  );
}
