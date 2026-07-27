import { useState } from "react";
import type { FormEvent } from "react";
import { Plus, Trash2, RotateCcw, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { SectionHeading } from "@/components/ui/SectionHeading";
import type { NavLink } from "@/config/navigation";
import { resolveMainNav } from "@/lib/navigationSettingsStore";
import { useNavigation } from "@/hooks/useNavigation";
import { validateNavLinks } from "@/lib/navigationValidation";
import type { NavLinkFormErrors } from "@/lib/navigationValidation";
import { PAGE_META } from "@/config/site";
import { useSiteMeta } from "@/hooks/useSiteMeta";

/**
 * Phase 21 - Navigation Editor. Admin UI over `config/navigation.ts`'s
 * `MAIN_NAV` - add/remove/reorder/rename the header nav links, replacing
 * hand-edits to that file. Same override/persistence pattern as every
 * prior editor (`lib/navigationSettingsStore.ts`/`hooks/useNavigation.ts`),
 * but the simplest shape yet: `MAIN_NAV` is already a flat ordered array
 * with no per-entry id, so the whole list is edited locally and saved as
 * one unit, rather than an id-keyed override map (Products/Categories) or
 * a named-variant pick (Theme/Homepage).
 *
 * `MAIN_NAV`'s `NavLink` shape (`{ label, to }`) has no nested-link field,
 * so this editor doesn't add one - Scope note: "support nested links if
 * the current structure allows it" only applies if it already does, and
 * it doesn't.
 *
 * `Navbar.tsx` reads the saved list through the same `useNavigation()`
 * hook across all three `navStyle` variants (`standard`/`centered`/
 * `minimal`), so a save here is reflected immediately, everywhere the nav
 * renders.
 */
export function NavigationEditor() {
  useSiteMeta(PAGE_META.adminNavigation);
  const { mainNav, isOverridden, save, reset } = useNavigation();

  const [links, setLinks] = useState<NavLink[]>(() => mainNav.map((link) => ({ ...link })));
  const [rowErrors, setRowErrors] = useState<NavLinkFormErrors[]>([]);
  const [listError, setListError] = useState<string | undefined>(undefined);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  function updateLinks(updater: (links: NavLink[]) => NavLink[]) {
    setLinks(updater);
    setSavedAt(null);
  }

  function updateField(index: number, field: keyof NavLink, value: string) {
    updateLinks((prev) => prev.map((link, i) => (i === index ? { ...link, [field]: value } : link)));
  }

  function addLink() {
    updateLinks((prev) => [...prev, { label: "", to: "" }]);
  }

  function removeLink(index: number) {
    updateLinks((prev) => prev.filter((_, i) => i !== index));
  }

  function move(index: number, direction: -1 | 1) {
    updateLinks((prev) => {
      const target = index + direction;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function handleReset() {
    reset();
    // `mainNav` here still reflects the just-cleared override (it's a
    // render-time value from before `reset()` took effect) - re-resolve
    // directly rather than passing the stale value to setLinks.
    setLinks(resolveMainNav().map((link) => ({ ...link })));
    setRowErrors([]);
    setListError(undefined);
    setSavedAt(null);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const trimmed = links.map((link) => ({ label: link.label.trim(), to: link.to.trim() }));
    const { listError: nextListError, rowErrors: nextRowErrors } = validateNavLinks(trimmed);
    setListError(nextListError);
    setRowErrors(nextRowErrors);
    if (nextListError || nextRowErrors.some((errors) => Object.keys(errors).length > 0)) return;

    save(trimmed);
    setLinks(trimmed);
    setSavedAt(Date.now());
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <SectionHeading eyebrow="Admin" title="Navigation Editor" align="left" />
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
        Add, remove, reorder, and rename the links shown in the header nav. Changes apply across every
        template style (standard, centered, and minimal nav layouts).
      </p>

      <form onSubmit={handleSubmit} noValidate className="mt-6 flex flex-col gap-6">
        <Card padding="none" className="overflow-hidden" data-testid="nav-link-list">
          {links.length === 0 ? (
            <p className="p-6 text-center text-sm text-ink-soft">
              No nav links yet - add one below.
            </p>
          ) : (
            <div className="flex flex-col divide-y divide-beige">
              {links.map((link, index) => {
                const errors = rowErrors[index] ?? {};
                return (
                  <div key={index} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start">
                    <div className="grid flex-1 gap-3 sm:grid-cols-2">
                      <Input
                        label="Label"
                        value={link.label}
                        onChange={(e) => updateField(index, "label", e.target.value)}
                        error={errors.label}
                      />
                      <Input
                        label="Link"
                        value={link.to}
                        onChange={(e) => updateField(index, "to", e.target.value)}
                        placeholder="/shop"
                        error={errors.to}
                      />
                    </div>
                    <div className="flex shrink-0 items-center gap-1 pt-1 sm:pt-7">
                      <button
                        type="button"
                        onClick={() => move(index, -1)}
                        disabled={index === 0}
                        aria-label={`Move ${link.label || "link"} up`}
                        className="rounded-md border-2 border-beige p-1.5 text-ink-soft transition-colors hover:border-denim/40 hover:text-denim disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-beige disabled:hover:text-ink-soft"
                      >
                        <ArrowUp size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => move(index, 1)}
                        disabled={index === links.length - 1}
                        aria-label={`Move ${link.label || "link"} down`}
                        className="rounded-md border-2 border-beige p-1.5 text-ink-soft transition-colors hover:border-denim/40 hover:text-denim disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-beige disabled:hover:text-ink-soft"
                      >
                        <ArrowDown size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeLink(index)}
                        aria-label={`Remove ${link.label || "link"}`}
                        className="rounded-md border-2 border-beige p-1.5 text-ink-soft transition-colors hover:border-error/60 hover:text-error"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {listError && <p className="text-sm text-error">{listError}</p>}

        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" variant="outline" size="sm" icon={<Plus size={16} />} onClick={addLink}>
            Add link
          </Button>
        </div>

        <div className="flex items-center gap-3 border-t border-beige pt-6">
          <Button type="submit">Save changes</Button>
          {savedAt && (
            <p role="status" className="text-sm font-medium text-denim-deep">
              Saved - changes are live across the site.
            </p>
          )}
        </div>
      </form>
    </div>
  );
}
