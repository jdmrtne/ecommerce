import { useState } from "react";
import type { FormEvent } from "react";
import { Plus, Trash2, RotateCcw, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { SectionHeading } from "@/components/ui/SectionHeading";
import type { NavLink } from "@/config/navigation";
import type { FooterLinkGroup } from "@/lib/footerSettingsStore";
import { resolveCopyrightHolder, resolveFooterLinkGroups } from "@/lib/footerSettingsStore";
import { useFooterSettings } from "@/hooks/useFooterSettings";
import {
  validateCopyrightHolder,
  validateFooterLinkGroups,
} from "@/lib/footerValidation";
import type { FooterGroupFormErrors } from "@/lib/footerValidation";
import { useStoreSettings } from "@/hooks/useStoreSettings";
import type { SocialLinks } from "@/config/business";
import { PAGE_META } from "@/config/site";
import { useSiteMeta } from "@/hooks/useSiteMeta";

/**
 * Phase 22 - Footer Editor. Admin UI over `config/navigation.ts`'s
 * `FOOTER_LINK_GROUPS`, `config/branding.ts`'s `copyrightHolder`, and
 * (see below) `business.social` - replacing hand-edits to those files.
 *
 * Link groups + copyright use their own new override
 * (`lib/footerSettingsStore.ts`/`hooks/useFooterSettings.ts`), the same
 * pattern as every prior editor. Groups are edited the same way Phase 21's
 * Navigation Editor edits `MAIN_NAV`: a local copy of the full list, saved
 * as one unit - just one level deeper (groups containing links, instead
 * of a flat link list).
 *
 * Social links are a deliberate exception: `business.social` already has
 * a complete editor (Phase 16 Store Settings) and a live consumer
 * (`Footer.tsx` already reads it through `useStoreSettings()`). Rather
 * than storing it a second time under a second override key - which would
 * let the two silently disagree about which value is "current" - this
 * page edits it in place through the *same* `useStoreSettings()` hook and
 * `save()` function Store Settings uses, so there's exactly one place the
 * data actually lives no matter which admin page an edit is made from.
 * "Reset to defaults" below only clears the Footer Editor's own override
 * (link groups + copyright); resetting social links is a Store Settings
 * action, linked to from this page's Social links card.
 */
export function FooterEditor() {
  useSiteMeta(PAGE_META.adminFooter);
  const { linkGroups, copyrightHolder, isOverridden, save, reset } = useFooterSettings();
  const { business, save: saveStoreSettings } = useStoreSettings();

  const [groups, setGroups] = useState<FooterLinkGroup[]>(() =>
    linkGroups.map((group) => ({ title: group.title, links: group.links.map((link) => ({ ...link })) })),
  );
  const [copyright, setCopyright] = useState(copyrightHolder);
  const [groupErrors, setGroupErrors] = useState<FooterGroupFormErrors[]>([]);
  const [copyrightError, setCopyrightError] = useState<string | undefined>(undefined);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const [social, setSocial] = useState<SocialLinks>({ ...business.social });
  const [socialSavedAt, setSocialSavedAt] = useState<number | null>(null);

  function updateGroups(updater: (groups: FooterLinkGroup[]) => FooterLinkGroup[]) {
    setGroups(updater);
    setSavedAt(null);
  }

  function updateGroupTitle(groupIndex: number, title: string) {
    updateGroups((prev) => prev.map((group, i) => (i === groupIndex ? { ...group, title } : group)));
  }

  function updateLinkField(groupIndex: number, linkIndex: number, field: keyof NavLink, value: string) {
    updateGroups((prev) =>
      prev.map((group, i) =>
        i === groupIndex
          ? { ...group, links: group.links.map((link, j) => (j === linkIndex ? { ...link, [field]: value } : link)) }
          : group,
      ),
    );
  }

  function addGroup() {
    updateGroups((prev) => [...prev, { title: "", links: [] }]);
  }

  function removeGroup(groupIndex: number) {
    updateGroups((prev) => prev.filter((_, i) => i !== groupIndex));
  }

  function moveGroup(groupIndex: number, direction: -1 | 1) {
    updateGroups((prev) => {
      const target = groupIndex + direction;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[groupIndex], next[target]] = [next[target], next[groupIndex]];
      return next;
    });
  }

  function addLink(groupIndex: number) {
    updateGroups((prev) =>
      prev.map((group, i) => (i === groupIndex ? { ...group, links: [...group.links, { label: "", to: "" }] } : group)),
    );
  }

  function removeLink(groupIndex: number, linkIndex: number) {
    updateGroups((prev) =>
      prev.map((group, i) =>
        i === groupIndex ? { ...group, links: group.links.filter((_, j) => j !== linkIndex) } : group,
      ),
    );
  }

  function moveLink(groupIndex: number, linkIndex: number, direction: -1 | 1) {
    updateGroups((prev) =>
      prev.map((group, i) => {
        if (i !== groupIndex) return group;
        const target = linkIndex + direction;
        if (target < 0 || target >= group.links.length) return group;
        const links = [...group.links];
        [links[linkIndex], links[target]] = [links[target], links[linkIndex]];
        return { ...group, links };
      }),
    );
  }

  function handleReset() {
    reset();
    // Same gotcha Phase 21 surfaced: `linkGroups`/`copyrightHolder` here
    // are render-time values from before `reset()` took effect - re-resolve
    // directly rather than passing the stale hook values to state.
    setGroups(
      resolveFooterLinkGroups().map((group) => ({ title: group.title, links: group.links.map((link) => ({ ...link })) })),
    );
    setCopyright(resolveCopyrightHolder());
    setGroupErrors([]);
    setCopyrightError(undefined);
    setSavedAt(null);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const trimmedGroups = groups.map((group) => ({
      title: group.title.trim(),
      links: group.links.map((link) => ({ label: link.label.trim(), to: link.to.trim() })),
    }));
    const trimmedCopyright = copyright.trim();

    const { groupErrors: nextGroupErrors } = validateFooterLinkGroups(trimmedGroups);
    const nextCopyrightError = validateCopyrightHolder(trimmedCopyright);
    setGroupErrors(nextGroupErrors);
    setCopyrightError(nextCopyrightError);

    const hasGroupErrors = nextGroupErrors.some(
      (errors) => errors.title || errors.linksError || errors.linkErrors.some((e) => Object.keys(e).length > 0),
    );
    if (hasGroupErrors || nextCopyrightError) return;

    save({ groups: trimmedGroups, copyrightHolder: trimmedCopyright });
    setGroups(trimmedGroups);
    setCopyright(trimmedCopyright);
    setSavedAt(Date.now());
  }

  function updateSocial<K extends keyof SocialLinks>(key: K, value: string) {
    setSocial((prev) => ({ ...prev, [key]: value || undefined }));
    setSocialSavedAt(null);
  }

  function handleSocialSubmit(e: FormEvent) {
    e.preventDefault();
    saveStoreSettings({ social });
    setSocialSavedAt(Date.now());
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <SectionHeading eyebrow="Admin" title="Footer Editor" align="left" />
        <Button
          type="button"
          variant="outline"
          size="sm"
          icon={<RotateCcw size={16} />}
          onClick={handleReset}
          disabled={!isOverridden}
        >
          Reset to defaults
        </Button>
      </div>

      <p className="mt-4 text-sm text-ink-soft">
        Edit the footer's link columns and copyright line. Changes apply across every template style
        (columns, stacked, and minimal footer layouts) - the minimal layout doesn't show link columns, but
        still shows the copyright line.
      </p>

      <form onSubmit={handleSubmit} noValidate className="mt-6 flex flex-col gap-6">
        <div className="flex flex-col gap-4" data-testid="footer-group-list">
          {groups.length === 0 ? (
            <Card padding="lg">
              <p className="text-center text-sm text-ink-soft">No footer link columns yet - add one below.</p>
            </Card>
          ) : (
            groups.map((group, groupIndex) => {
              const errors = groupErrors[groupIndex];
              return (
                <Card key={groupIndex} padding="lg" className="flex flex-col gap-4">
                  <div className="flex flex-wrap items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <Input
                        label="Column title"
                        value={group.title}
                        onChange={(e) => updateGroupTitle(groupIndex, e.target.value)}
                        error={errors?.title}
                      />
                    </div>
                    <div className="flex shrink-0 items-center gap-1 pt-7">
                      <button
                        type="button"
                        onClick={() => moveGroup(groupIndex, -1)}
                        disabled={groupIndex === 0}
                        aria-label={`Move ${group.title || "column"} up`}
                        className="rounded-md border-2 border-beige p-1.5 text-ink-soft transition-colors hover:border-denim/40 hover:text-denim disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-beige disabled:hover:text-ink-soft"
                      >
                        <ArrowUp size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveGroup(groupIndex, 1)}
                        disabled={groupIndex === groups.length - 1}
                        aria-label={`Move ${group.title || "column"} down`}
                        className="rounded-md border-2 border-beige p-1.5 text-ink-soft transition-colors hover:border-denim/40 hover:text-denim disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-beige disabled:hover:text-ink-soft"
                      >
                        <ArrowDown size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeGroup(groupIndex)}
                        aria-label={`Remove ${group.title || "column"}`}
                        className="rounded-md border-2 border-beige p-1.5 text-ink-soft transition-colors hover:border-error/60 hover:text-error"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col divide-y divide-beige rounded-md border-2 border-beige">
                    {group.links.length === 0 ? (
                      <p className="p-3 text-center text-sm text-ink-soft">No links in this column yet.</p>
                    ) : (
                      group.links.map((link, linkIndex) => {
                        const linkErrors = errors?.linkErrors[linkIndex] ?? {};
                        return (
                          <div key={linkIndex} className="flex flex-col gap-3 p-3 sm:flex-row sm:items-start">
                            <div className="grid flex-1 gap-3 sm:grid-cols-2">
                              <Input
                                label="Label"
                                value={link.label}
                                onChange={(e) => updateLinkField(groupIndex, linkIndex, "label", e.target.value)}
                                error={linkErrors.label}
                              />
                              <Input
                                label="Link"
                                value={link.to}
                                onChange={(e) => updateLinkField(groupIndex, linkIndex, "to", e.target.value)}
                                placeholder="/shop"
                                error={linkErrors.to}
                              />
                            </div>
                            <div className="flex shrink-0 items-center gap-1 pt-1 sm:pt-7">
                              <button
                                type="button"
                                onClick={() => moveLink(groupIndex, linkIndex, -1)}
                                disabled={linkIndex === 0}
                                aria-label={`Move ${link.label || "link"} up`}
                                className="rounded-md border-2 border-beige p-1.5 text-ink-soft transition-colors hover:border-denim/40 hover:text-denim disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-beige disabled:hover:text-ink-soft"
                              >
                                <ArrowUp size={14} />
                              </button>
                              <button
                                type="button"
                                onClick={() => moveLink(groupIndex, linkIndex, 1)}
                                disabled={linkIndex === group.links.length - 1}
                                aria-label={`Move ${link.label || "link"} down`}
                                className="rounded-md border-2 border-beige p-1.5 text-ink-soft transition-colors hover:border-denim/40 hover:text-denim disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-beige disabled:hover:text-ink-soft"
                              >
                                <ArrowDown size={14} />
                              </button>
                              <button
                                type="button"
                                onClick={() => removeLink(groupIndex, linkIndex)}
                                aria-label={`Remove ${link.label || "link"}`}
                                className="rounded-md border-2 border-beige p-1.5 text-ink-soft transition-colors hover:border-error/60 hover:text-error"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                  {errors?.linksError && <p className="text-sm text-error">{errors.linksError}</p>}

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    icon={<Plus size={16} />}
                    onClick={() => addLink(groupIndex)}
                    className="self-start"
                  >
                    Add link
                  </Button>
                </Card>
              );
            })
          )}
        </div>

        <Button type="button" variant="outline" size="sm" icon={<Plus size={16} />} onClick={addGroup} className="self-start">
          Add column
        </Button>

        <Card padding="lg" className="flex flex-col gap-4">
          <h2 className="font-display text-lg text-ink">Copyright line</h2>
          <Input
            label="Copyright name"
            value={copyright}
            onChange={(e) => {
              setCopyright(e.target.value);
              setSavedAt(null);
            }}
            hint={`Shown as "© ${new Date().getFullYear()} ${copyright || "..."}. All rights reserved."`}
            error={copyrightError}
          />
        </Card>

        <div className="flex items-center gap-3 border-t border-beige pt-6">
          <Button type="submit">Save changes</Button>
          {savedAt && (
            <p role="status" className="text-sm font-medium text-denim-deep">
              Saved - changes are live across the site.
            </p>
          )}
        </div>
      </form>

      <Card padding="lg" className="mt-8 flex flex-col gap-4">
        <div>
          <h2 className="font-display text-lg text-ink">Social links</h2>
          <p className="mt-1 text-sm text-ink-soft">
            Shown in the footer's social icon row. This is the same data as{" "}
            <a href="/admin/store-settings" className="font-medium text-denim underline">
              Store Settings
            </a>
            's Social links card - editing it here updates it there too.
          </p>
        </div>
        <form onSubmit={handleSocialSubmit} noValidate className="flex flex-col gap-4">
          <Input
            label="Facebook URL"
            value={social.facebook ?? ""}
            onChange={(e) => updateSocial("facebook", e.target.value)}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Instagram URL"
              value={social.instagram ?? ""}
              onChange={(e) => updateSocial("instagram", e.target.value)}
            />
            <Input
              label="Instagram handle"
              value={social.instagramHandle ?? ""}
              onChange={(e) => updateSocial("instagramHandle", e.target.value)}
              placeholder="@yourbusiness"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="TikTok URL"
              value={social.tiktok ?? ""}
              onChange={(e) => updateSocial("tiktok", e.target.value)}
            />
            <Input
              label="Messenger URL"
              value={social.messenger ?? ""}
              onChange={(e) => updateSocial("messenger", e.target.value)}
            />
          </div>
          <div className="flex items-center gap-3">
            <Button type="submit">Save social links</Button>
            {socialSavedAt && (
              <p role="status" className="text-sm font-medium text-denim-deep">
                Saved - changes are live across the site.
              </p>
            )}
          </div>
        </form>
      </Card>
    </div>
  );
}
