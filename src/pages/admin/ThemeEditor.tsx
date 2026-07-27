import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Check, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { cn } from "@/lib/cn";
import { ACTIVE_PRESET_ID, PRESETS, TEMPLATE_PRESETS, applyPreset } from "@/config/presets";
import { classicPreset } from "@/config/presets/classic";
import type { ThemeConfig } from "@/config/theme";
import { DISPLAY_FONT_OPTIONS, BODY_FONT_OPTIONS } from "@/config/fontOptions";
import { RADIUS_SCALE_OPTIONS, matchRadiusScaleId } from "@/config/radiusScales";
import { resolveActivePreset } from "@/lib/themeSettingsStore";
import { useThemeSettings } from "@/hooks/useThemeSettings";
import { PAGE_META } from "@/config/site";
import { useSiteMeta } from "@/hooks/useSiteMeta";

interface FormState {
  presetId: string;
  theme: ThemeConfig;
}

function stateFromPreset(presetId: string, theme: ThemeConfig): FormState {
  return { presetId, theme };
}

const COLOR_GROUPS: { title: string; keys: (keyof ThemeConfig["colors"])[] }[] = [
  { title: "Backgrounds", keys: ["cream", "surface", "beige", "beigeDark"] },
  { title: "Text", keys: ["ink", "inkSoft"] },
  { title: "Primary accent", keys: ["primary", "primaryDeep", "primaryTint"] },
  { title: "Secondary accent", keys: ["accent", "accentDeep", "accentTint"] },
  { title: "Status", keys: ["success", "error"] },
];

const COLOR_LABELS: Record<keyof ThemeConfig["colors"], string> = {
  cream: "Page background",
  surface: "Card/panel background",
  beige: "Muted background",
  beigeDark: "Muted background (dark)",
  ink: "Body text",
  inkSoft: "Secondary text",
  primary: "Primary",
  primaryDeep: "Primary (deep)",
  primaryTint: "Primary (tint)",
  accent: "Accent",
  accentDeep: "Accent (deep)",
  accentTint: "Accent (tint)",
  success: "Success",
  error: "Error",
};

const CARD_STYLE_OPTIONS: ThemeConfig["cardStyle"][] = ["soft", "flat", "outlined"];
const BUTTON_STYLE_OPTIONS: ThemeConfig["buttonStyle"][] = ["rounded", "pill", "square"];

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex items-center gap-3">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 w-9 shrink-0 cursor-pointer rounded-md border-2 border-beige bg-transparent p-0.5"
        aria-label={label}
      />
      <span className="flex flex-col leading-tight">
        <span className="text-sm font-medium text-ink">{label}</span>
        <span className="text-xs text-ink-soft">{value}</span>
      </span>
    </label>
  );
}

/**
 * Phase 17 - Theme Editor, the second admin editor, reusing the Phase 16
 * override pattern (`lib/themeSettingsStore.ts`/`hooks/useThemeSettings.ts`)
 * for a different slice of config: which of the 10 shipped presets
 * (`config/presets/`) is active, and a customized `ThemeConfig` on top of
 * it (colors/fonts/radius/card/button style).
 *
 * Unlike Store Settings, this page also drives a genuinely live, whole-
 * document preview: every field change calls `applyPreset()` directly
 * (the same CSS-custom-property mechanism `main.tsx` uses at boot), so the
 * admin shell itself re-skins as you edit - no separate preview widget
 * needed. Nothing is written to `localStorage` until "Save changes";
 * leaving the page without saving reverts the live preview back to
 * whatever's actually persisted (see the unmount effect below).
 */
export function ThemeEditor() {
  useSiteMeta(PAGE_META.adminTheme);
  const { save, reset, isOverridden } = useThemeSettings();

  const [form, setForm] = useState<FormState>(() => {
    const resolved = resolveActivePreset();
    return stateFromPreset(resolved.id, resolved.theme);
  });
  const [savedAt, setSavedAt] = useState<number | null>(null);

  // Live preview: apply every in-progress edit straight to the document,
  // the same way `main.tsx` applies the resolved preset at boot.
  useEffect(() => {
    const preset = PRESETS[form.presetId] ?? classicPreset;
    applyPreset({ ...preset, theme: form.theme });
  }, [form]);

  // Leaving the page without saving reverts the live preview to whatever
  // is actually persisted, so an abandoned edit doesn't linger visually.
  useEffect(() => {
    return () => {
      applyPreset(resolveActivePreset());
    };
  }, []);

  function selectPreset(presetId: string) {
    const preset = PRESETS[presetId];
    if (!preset) return;
    setForm(stateFromPreset(preset.id, preset.theme));
    setSavedAt(null);
  }

  function updateTheme(updater: (theme: ThemeConfig) => ThemeConfig) {
    setForm((prev) => ({ ...prev, theme: updater(prev.theme) }));
    setSavedAt(null);
  }

  function updateColor(key: keyof ThemeConfig["colors"], value: string) {
    updateTheme((theme) => ({ ...theme, colors: { ...theme.colors, [key]: value } }));
  }

  function updateFont(kind: "display" | "body", value: string) {
    updateTheme((theme) => ({ ...theme, fonts: { ...theme.fonts, [kind]: value } }));
  }

  function updateRadiusScale(scaleId: string) {
    const scale = RADIUS_SCALE_OPTIONS.find((option) => option.id === scaleId);
    if (!scale) return;
    updateTheme((theme) => ({ ...theme, radius: { ...scale.radius } }));
  }

  function updateCardStyle(value: ThemeConfig["cardStyle"]) {
    updateTheme((theme) => ({ ...theme, cardStyle: value }));
  }

  function updateButtonStyle(value: ThemeConfig["buttonStyle"]) {
    updateTheme((theme) => ({ ...theme, buttonStyle: value }));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    save({ activePresetId: form.presetId, theme: form.theme });
    setSavedAt(Date.now());
  }

  function handleReset() {
    reset();
    const preset = PRESETS[ACTIVE_PRESET_ID] ?? classicPreset;
    setForm(stateFromPreset(preset.id, preset.theme));
    setSavedAt(null);
  }

  const matchedRadiusId = matchRadiusScaleId(form.theme.radius) ?? "__custom__";

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <SectionHeading eyebrow="Admin" title="Theme Editor" align="left" />
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
          <h2 className="font-display text-lg text-ink">Template preset</h2>
          <p className="text-sm text-ink-soft">
            Picking a preset resets the customization below to that preset&apos;s own look - tweak it
            further, then save.
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {TEMPLATE_PRESETS.map((preset) => {
              const isSelected = preset.id === form.presetId;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => selectPreset(preset.id)}
                  aria-pressed={isSelected}
                  className={cn(
                    "flex flex-col gap-2 rounded-lg border-2 p-4 text-left transition-colors",
                    isSelected ? "border-denim bg-denim-tint/40" : "border-beige bg-surface hover:border-denim/40",
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-display text-base text-ink">{preset.name}</span>
                    {isSelected && <Check size={16} className="shrink-0 text-denim" aria-hidden="true" />}
                  </div>
                  <p className="text-xs text-ink-soft">{preset.description}</p>
                  <div className="flex items-center gap-1.5">
                    {[
                      preset.theme.colors.cream,
                      preset.theme.colors.primary,
                      preset.theme.colors.accent,
                      preset.theme.colors.ink,
                    ].map((swatch, i) => (
                      <span
                        key={i}
                        className="h-5 w-5 rounded-full border border-beige"
                        style={{ backgroundColor: swatch }}
                      />
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </Card>

        <Card padding="lg" className="flex flex-col gap-4">
          <h2 className="font-display text-lg text-ink">Typography &amp; shape</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label="Display font"
              value={form.theme.fonts.display}
              onChange={(e) => updateFont("display", e.target.value)}
            >
              {DISPLAY_FONT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
            <Select
              label="Body font"
              value={form.theme.fonts.body}
              onChange={(e) => updateFont("body", e.target.value)}
            >
              {BODY_FONT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Select
              label="Corner radius"
              value={matchedRadiusId}
              onChange={(e) => updateRadiusScale(e.target.value)}
            >
              {matchedRadiusId === "__custom__" && (
                <option value="__custom__" disabled>
                  Custom (preset default)
                </option>
              )}
              {RADIUS_SCALE_OPTIONS.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </Select>
            <Select
              label="Card style"
              value={form.theme.cardStyle}
              onChange={(e) => updateCardStyle(e.target.value as ThemeConfig["cardStyle"])}
            >
              {CARD_STYLE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option[0].toUpperCase() + option.slice(1)}
                </option>
              ))}
            </Select>
            <Select
              label="Button style"
              value={form.theme.buttonStyle}
              onChange={(e) => updateButtonStyle(e.target.value as ThemeConfig["buttonStyle"])}
            >
              {BUTTON_STYLE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option[0].toUpperCase() + option.slice(1)}
                </option>
              ))}
            </Select>
          </div>
        </Card>

        <Card padding="lg" className="flex flex-col gap-5">
          <h2 className="font-display text-lg text-ink">Colors</h2>
          {COLOR_GROUPS.map((group) => (
            <div key={group.title} className="flex flex-col gap-3">
              <h3 className="text-sm font-semibold text-ink-soft">{group.title}</h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {group.keys.map((key) => (
                  <ColorField
                    key={key}
                    label={COLOR_LABELS[key]}
                    value={form.theme.colors[key]}
                    onChange={(value) => updateColor(key, value)}
                  />
                ))}
              </div>
            </div>
          ))}
        </Card>

        <div className="flex flex-wrap items-center gap-4">
          <Button type="submit">Save changes</Button>
          {savedAt && (
            <p role="status" className="text-sm font-medium text-denim-deep">
              Saved - your theme is live across the site.
            </p>
          )}
        </div>
      </form>
    </div>
  );
}
