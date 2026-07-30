import { useState } from "react";
import type { FormEvent } from "react";
import { Plus, Trash2, RotateCcw, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input, Textarea } from "@/components/ui/Input";
import { SectionHeading } from "@/components/ui/SectionHeading";
import type { ShippingMethod } from "@/types/shipping";
import { generateShippingMethodId, resolveShippingMethods } from "@/lib/shippingSettingsStore";
import { useShippingSettings } from "@/hooks/useShippingSettings";
import { validateShippingMethods } from "@/lib/shippingValidation";
import type { ShippingMethodFormErrors } from "@/lib/shippingValidation";
import { PAGE_META } from "@/config/site";
import { useSiteMeta } from "@/hooks/useSiteMeta";

interface MethodFormRow {
  /** Empty for a not-yet-saved new row - a real id is generated on save. */
  id: string;
  name: string;
  description: string;
  rate: string;
  freeThreshold: string;
  /** Comma-separated province names, editable as plain text - converted to/from `ShippingMethod.provinces` on save/load. */
  provinces: string;
}

function toFormRow(method: ShippingMethod): MethodFormRow {
  return {
    id: method.id,
    name: method.name,
    description: method.description ?? "",
    rate: String(method.rate),
    freeThreshold: method.freeThreshold === undefined ? "" : String(method.freeThreshold),
    provinces: method.provinces?.join(", ") ?? "",
  };
}

function parseProvinces(value: string): string[] | undefined {
  const provinces = value
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
  return provinces.length > 0 ? provinces : undefined;
}

/**
 * Phase 32 - Shipping. Admin UI over `config/shipping.ts`'s
 * `DEFAULT_SHIPPING_METHODS` - add/remove/reorder/edit the shipping
 * methods shown as a choice at checkout, replacing what used to be a
 * hardcoded flat rate/free-shipping-threshold pair in `lib/checkout.ts`.
 * Same override/persistence pattern as every prior editor
 * (`lib/shippingSettingsStore.ts`/`hooks/useShippingSettings.ts`), and the
 * same simplest shape as Phase 21's Navigation Editor: the method list has
 * no id referenced elsewhere, so the whole array is edited locally and
 * saved as one unit rather than an id-keyed override map.
 *
 * Each row edits a flat rate, an optional free-shipping subtotal
 * threshold, and an optional comma-separated province list - a method
 * with no provinces is available nationwide; one with provinces listed is
 * a simple shipping "zone", only offered at checkout when the shopper's
 * province matches (see `lib/shippingSettingsStore.ts`'s
 * `filterMethodsForProvince()`, shared by both this page and
 * `Checkout.tsx` so the two can't drift on the matching rule).
 *
 * `Checkout.tsx` reads the saved list through the same
 * `useShippingSettings()` hook, so a save here is reflected immediately
 * at checkout, with no reload.
 */
export function ShippingEditor() {
  useSiteMeta(PAGE_META.adminShipping);
  const { methods, isOverridden, save, reset } = useShippingSettings();

  const [rows, setRows] = useState<MethodFormRow[]>(() => methods.map(toFormRow));
  const [rowErrors, setRowErrors] = useState<ShippingMethodFormErrors[]>([]);
  const [listError, setListError] = useState<string | undefined>(undefined);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  function updateRows(updater: (rows: MethodFormRow[]) => MethodFormRow[]) {
    setRows(updater);
    setSavedAt(null);
  }

  function updateField(index: number, field: keyof MethodFormRow, value: string) {
    updateRows((prev) => prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
  }

  function addRow() {
    updateRows((prev) => [
      ...prev,
      { id: "", name: "", description: "", rate: "", freeThreshold: "", provinces: "" },
    ]);
  }

  function removeRow(index: number) {
    updateRows((prev) => prev.filter((_, i) => i !== index));
  }

  function move(index: number, direction: -1 | 1) {
    updateRows((prev) => {
      const target = index + direction;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function handleReset() {
    reset();
    // `methods` here still reflects the just-cleared override (it's a
    // render-time value from before `reset()` took effect) - re-resolve
    // directly rather than passing the stale value to setRows, same
    // gotcha `NavigationEditor.tsx` documents.
    setRows(resolveShippingMethods().map(toFormRow));
    setRowErrors([]);
    setListError(undefined);
    setSavedAt(null);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const trimmedRows = rows.map((row) => ({
      ...row,
      name: row.name.trim(),
      description: row.description.trim(),
      rate: row.rate.trim(),
      freeThreshold: row.freeThreshold.trim(),
      provinces: row.provinces.trim(),
    }));
    const { listError: nextListError, rowErrors: nextRowErrors } = validateShippingMethods(trimmedRows);
    setListError(nextListError);
    setRowErrors(nextRowErrors);
    if (nextListError || nextRowErrors.some((errors) => Object.keys(errors).length > 0)) return;

    const existingIds = trimmedRows.filter((row) => row.id).map((row) => row.id);
    const toSave: ShippingMethod[] = trimmedRows.map((row) => {
      const id = row.id || generateShippingMethodId(row.name, existingIds);
      if (!row.id) existingIds.push(id);
      return {
        id,
        name: row.name,
        description: row.description || undefined,
        rate: Number(row.rate),
        freeThreshold: row.freeThreshold === "" ? undefined : Number(row.freeThreshold),
        provinces: parseProvinces(row.provinces),
      };
    });

    save(toSave);
    setRows(toSave.map(toFormRow));
    setSavedAt(Date.now());
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <SectionHeading eyebrow="Admin" title="Shipping" align="left" />
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
        Add, remove, reorder, and edit the shipping methods shown at checkout. Leave provinces blank for a method
        available nationwide, or list one or more provinces (comma-separated) to limit it to a shipping zone -
        checkout only offers a zone-restricted method when it matches the address entered.
      </p>

      <form onSubmit={handleSubmit} noValidate className="mt-6 flex flex-col gap-6">
        <Card padding="none" className="overflow-hidden" data-testid="shipping-method-list">
          {rows.length === 0 ? (
            <p className="p-6 text-center text-sm text-ink-soft">No shipping methods yet - add one below.</p>
          ) : (
            <div className="flex flex-col divide-y divide-beige">
              {rows.map((row, index) => {
                const errors = rowErrors[index] ?? {};
                return (
                  <div key={index} className="flex flex-col gap-3 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                      <div className="grid flex-1 gap-3 sm:grid-cols-2">
                        <Input
                          label="Name"
                          value={row.name}
                          onChange={(e) => updateField(index, "name", e.target.value)}
                          error={errors.name}
                        />
                        <Input
                          label="Rate (₱)"
                          inputMode="decimal"
                          value={row.rate}
                          onChange={(e) => updateField(index, "rate", e.target.value)}
                          error={errors.rate}
                        />
                      </div>
                      <div className="flex shrink-0 items-center gap-1 pt-1 sm:pt-7">
                        <button
                          type="button"
                          onClick={() => move(index, -1)}
                          disabled={index === 0}
                          aria-label={`Move ${row.name || "method"} up`}
                          className="rounded-md border-2 border-beige p-1.5 text-ink-soft transition-colors hover:border-denim/40 hover:text-denim disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-beige disabled:hover:text-ink-soft"
                        >
                          <ArrowUp size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => move(index, 1)}
                          disabled={index === rows.length - 1}
                          aria-label={`Move ${row.name || "method"} down`}
                          className="rounded-md border-2 border-beige p-1.5 text-ink-soft transition-colors hover:border-denim/40 hover:text-denim disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-beige disabled:hover:text-ink-soft"
                        >
                          <ArrowDown size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeRow(index)}
                          aria-label={`Remove ${row.name || "method"}`}
                          className="rounded-md border-2 border-beige p-1.5 text-ink-soft transition-colors hover:border-error/60 hover:text-error"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    <Textarea
                      label="Description (optional)"
                      value={row.description}
                      onChange={(e) => updateField(index, "description", e.target.value)}
                      placeholder="Delivered in 3-7 business days."
                    />
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Input
                        label="Free shipping at or above (₱, optional)"
                        inputMode="decimal"
                        value={row.freeThreshold}
                        onChange={(e) => updateField(index, "freeThreshold", e.target.value)}
                        error={errors.freeThreshold}
                        placeholder="Leave blank for none"
                      />
                      <Input
                        label="Provinces (optional)"
                        value={row.provinces}
                        onChange={(e) => updateField(index, "provinces", e.target.value)}
                        placeholder="Leave blank for nationwide"
                        hint="Comma-separated, e.g. Metro Manila, Cavite"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {listError && <p className="text-sm text-error">{listError}</p>}

        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" variant="outline" size="sm" icon={<Plus size={16} />} onClick={addRow}>
            Add shipping method
          </Button>
        </div>

        <div className="flex items-center gap-3 border-t border-beige pt-6">
          <Button type="submit">Save changes</Button>
          {savedAt && (
            <p role="status" className="text-sm font-medium text-denim-deep">
              Saved - changes are live at checkout.
            </p>
          )}
        </div>
      </form>
    </div>
  );
}
