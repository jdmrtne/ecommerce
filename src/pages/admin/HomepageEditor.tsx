import { useState } from "react";
import type { FormEvent } from "react";
import { Check, ChevronDown, RotateCcw, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { cn } from "@/lib/cn";
import type { SectionSettings, SectionInstance } from "@/types/layout";
import { ACTIVE_HOME_LAYOUT, HOME_LAYOUTS, HOMEPAGE_SECTION_LABELS } from "@/config/layouts/home";
import type { HomeLayoutId, HomepageSectionKey } from "@/config/layouts/home";
import { buildFullSectionList, resolveActiveHomeLayoutId } from "@/lib/homepageSettingsStore";
import { useHomepageSettings } from "@/hooks/useHomepageSettings";
import { PAGE_META } from "@/config/site";
import { useSiteMeta } from "@/hooks/useSiteMeta";

interface FormState {
  layoutId: HomeLayoutId;
  sections: SectionInstance<HomepageSectionKey>[];
}

function stateFromLayoutId(layoutId: HomeLayoutId): FormState {
  return { layoutId, sections: buildFullSectionList(HOME_LAYOUTS[layoutId]) };
}

const PADDING_OPTIONS: NonNullable<SectionSettings["padding"]>[] = ["none", "sm", "md", "lg", "xl"];
const BACKGROUND_OPTIONS: NonNullable<SectionSettings["background"]>[] = [
  "transparent",
  "surface",
  "beige",
  "denim-tint",
  "bloom-tint",
];
const WIDTH_OPTIONS: NonNullable<SectionSettings["width"]>[] = ["narrow", "medium", "default", "wide", "full"];
const ALIGN_OPTIONS: NonNullable<SectionSettings["align"]>[] = ["left", "center"];

/**
 * Phase 18 - Homepage Editor, the third admin editor, reusing the
 * Phase 16/17 override pattern for a third slice of config:
 * `config/layouts/home.ts`'s `PageLayout`. Unlike Theme Editor there's no
 * document-wide side effect to preview live - a section arrangement is
 * just data `pages/Home.tsx` reads at render time - so this page is a
 * more conventional list editor: pick a starting layout, then reorder/
 * enable/configure its 12 possible sections, and save.
 */
export function HomepageEditor() {
  useSiteMeta(PAGE_META.adminHomepage);
  const { save, reset, isOverridden } = useHomepageSettings();

  const [form, setForm] = useState<FormState>(() => stateFromLayoutId(resolveActiveHomeLayoutId()));
  const [expandedKey, setExpandedKey] = useState<HomepageSectionKey | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  function selectLayout(layoutId: HomeLayoutId) {
    setForm(stateFromLayoutId(layoutId));
    setSavedAt(null);
  }

  function updateSections(
    updater: (sections: SectionInstance<HomepageSectionKey>[]) => SectionInstance<HomepageSectionKey>[],
  ) {
    setForm((prev) => ({ ...prev, sections: updater(prev.sections) }));
    setSavedAt(null);
  }

  function toggleEnabled(key: HomepageSectionKey) {
    updateSections((sections) =>
      sections.map((section) => (section.key === key ? { ...section, enabled: !section.enabled } : section)),
    );
  }

  function move(index: number, direction: -1 | 1) {
    updateSections((sections) => {
      const target = index + direction;
      if (target < 0 || target >= sections.length) return sections;
      const next = [...sections];
      [next[index], next[target]] = [next[target], next[index]];
      return next.map((section, i) => ({ ...section, order: i }));
    });
  }

  function updateField(key: HomepageSectionKey, field: "title" | "subtitle", value: string) {
    updateSections((sections) =>
      sections.map((section) => (section.key === key ? { ...section, [field]: value || undefined } : section)),
    );
  }

  function updateSetting<K extends keyof SectionSettings>(key: HomepageSectionKey, field: K, value: string) {
    updateSections((sections) =>
      sections.map((section) =>
        section.key === key
          ? { ...section, settings: { ...section.settings, [field]: value === "" ? undefined : value } }
          : section,
      ),
    );
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    save({ activeLayoutId: form.layoutId, sections: form.sections });
    setSavedAt(Date.now());
  }

  function handleReset() {
    reset();
    setForm(stateFromLayoutId(ACTIVE_HOME_LAYOUT));
    setExpandedKey(null);
    setSavedAt(null);
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <SectionHeading eyebrow="Admin" title="Homepage Editor" align="left" />
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

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-6">
        <Card padding="lg" className="flex flex-col gap-4">
          <h2 className="font-display text-lg text-ink">Starting layout</h2>
          <p className="text-sm text-ink-soft">
            Picking a layout resets the section arrangement below to that layout&apos;s own default - reorder,
            toggle, and configure it further, then save.
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {(Object.entries(HOME_LAYOUTS) as [HomeLayoutId, (typeof HOME_LAYOUTS)[HomeLayoutId]][]).map(
              ([id, layout]) => {
                const isSelected = id === form.layoutId;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => selectLayout(id)}
                    aria-pressed={isSelected}
                    className={cn(
                      "flex flex-col gap-1.5 rounded-lg border-2 p-4 text-left transition-colors",
                      isSelected ? "border-denim bg-denim-tint/40" : "border-beige bg-surface hover:border-denim/40",
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-display text-base text-ink">{layout.label}</span>
                      {isSelected && <Check size={16} className="shrink-0 text-denim" aria-hidden="true" />}
                    </div>
                    <p className="text-xs text-ink-soft">{layout.description}</p>
                  </button>
                );
              },
            )}
          </div>
        </Card>

        <Card padding="lg" className="flex flex-col gap-2">
          <h2 className="font-display text-lg text-ink">Sections</h2>
          <p className="mb-2 text-sm text-ink-soft">
            Toggle sections on or off, reorder with the arrows, and expand a section to customize its heading and
            appearance.
          </p>
          <div className="flex flex-col divide-y divide-beige">
            {form.sections.map((section, index) => {
              const isExpanded = expandedKey === section.key;
              return (
                <div key={section.key} className="py-3">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={section.enabled}
                      onChange={() => toggleEnabled(section.key)}
                      aria-label={`Enable ${HOMEPAGE_SECTION_LABELS[section.key]}`}
                      className="h-4 w-4 rounded border-2 border-beige accent-denim"
                    />
                    <span
                      className={cn("flex-1 font-medium", section.enabled ? "text-ink" : "text-ink-soft line-through")}
                    >
                      {HOMEPAGE_SECTION_LABELS[section.key]}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => move(index, -1)}
                        disabled={index === 0}
                        aria-label={`Move ${HOMEPAGE_SECTION_LABELS[section.key]} up`}
                        className="rounded-md border-2 border-beige p-1.5 text-ink-soft transition-colors hover:border-denim/40 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <ArrowUp size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => move(index, 1)}
                        disabled={index === form.sections.length - 1}
                        aria-label={`Move ${HOMEPAGE_SECTION_LABELS[section.key]} down`}
                        className="rounded-md border-2 border-beige p-1.5 text-ink-soft transition-colors hover:border-denim/40 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <ArrowDown size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setExpandedKey(isExpanded ? null : section.key)}
                        aria-expanded={isExpanded}
                        aria-label={`${isExpanded ? "Collapse" : "Expand"} ${HOMEPAGE_SECTION_LABELS[section.key]} settings`}
                        className="rounded-md border-2 border-beige p-1.5 text-ink-soft transition-colors hover:border-denim/40"
                      >
                        <ChevronDown size={14} className={cn("transition-transform", isExpanded && "rotate-180")} />
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-3 flex flex-col gap-3 rounded-lg bg-beige/40 p-4">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <Input
                          label="Title override"
                          value={section.title ?? ""}
                          onChange={(e) => updateField(section.key, "title", e.target.value)}
                          placeholder="Leave blank to use the default"
                        />
                        <Input
                          label="Subtitle override"
                          value={section.subtitle ?? ""}
                          onChange={(e) => updateField(section.key, "subtitle", e.target.value)}
                          placeholder="Leave blank to use the default"
                        />
                      </div>
                      <div className="grid gap-3 sm:grid-cols-4">
                        <Select
                          label="Padding"
                          value={section.settings?.padding ?? ""}
                          onChange={(e) => updateSetting(section.key, "padding", e.target.value)}
                        >
                          <option value="">Default</option>
                          {PADDING_OPTIONS.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </Select>
                        <Select
                          label="Background"
                          value={section.settings?.background ?? ""}
                          onChange={(e) => updateSetting(section.key, "background", e.target.value)}
                        >
                          <option value="">Default</option>
                          {BACKGROUND_OPTIONS.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </Select>
                        <Select
                          label="Width"
                          value={section.settings?.width ?? ""}
                          onChange={(e) => updateSetting(section.key, "width", e.target.value)}
                        >
                          <option value="">Default</option>
                          {WIDTH_OPTIONS.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </Select>
                        <Select
                          label="Align"
                          value={section.settings?.align ?? ""}
                          onChange={(e) => updateSetting(section.key, "align", e.target.value)}
                        >
                          <option value="">Default</option>
                          {ALIGN_OPTIONS.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </Select>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>

        <div className="flex flex-wrap items-center gap-4">
          <Button type="submit">Save changes</Button>
          {savedAt && (
            <p role="status" className="text-sm font-medium text-denim-deep">
              Saved - visit the homepage to see it live.
            </p>
          )}
        </div>
      </form>
    </div>
  );
}
