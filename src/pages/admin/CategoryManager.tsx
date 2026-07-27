import { useCallback, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Plus, Pencil, Trash2, RotateCcw, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input, Textarea } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { EmptyState } from "@/components/ui/StateMessage";
import { ICON_REGISTRY } from "@/lib/iconRegistry";
import { generateCategoryId } from "@/lib/categoriesStore";
import { validateCategory } from "@/lib/categoryValidation";
import type { CategoryFormErrors } from "@/lib/categoryValidation";
import { useCategories } from "@/hooks/useCategories";
import { PAGE_META } from "@/config/site";
import { useSiteMeta } from "@/hooks/useSiteMeta";
import type { Category } from "@/types/product";

const ICON_NAMES = Object.keys(ICON_REGISTRY);

interface FormState {
  id: string;
  label: string;
  description: string;
  icon: string;
  tone: "primary" | "accent";
  itemCount: string;
  image: string;
  featured: boolean;
}

function blankForm(): FormState {
  return {
    id: "",
    label: "",
    description: "",
    icon: ICON_NAMES[0] ?? "Package",
    tone: "primary",
    itemCount: "0",
    image: "",
    featured: false,
  };
}

function formFromCategory(category: Category): FormState {
  return {
    id: category.id,
    label: category.label,
    description: category.description,
    icon: category.icon,
    tone: category.tone,
    itemCount: String(category.itemCount),
    image: category.image ?? "",
    featured: category.featured ?? false,
  };
}

/** Builds the `Category` this form describes, given the id/slug to save it under. */
function buildCategory(form: FormState, id: string): Category {
  return {
    id,
    slug: id,
    label: form.label.trim(),
    description: form.description.trim(),
    icon: form.icon,
    tone: form.tone,
    itemCount: form.itemCount.trim() ? Number(form.itemCount) : 0,
    image: form.image.trim() || undefined,
    featured: form.featured || undefined,
  };
}

type ModalState = { mode: "create" } | { mode: "edit"; category: Category } | null;

/**
 * Phase 20 - Category Manager. Admin CRUD for `data/categories.ts`,
 * replacing direct edits to that file - same override pattern as Product
 * Manager (Phase 19) via `lib/categoriesStore.ts`/`hooks/useCategories.ts`:
 * saves/deletes persist to `localStorage`, layered over the static seed
 * list, and every storefront consumer (Shop's category filter, the
 * homepage `Categories` section, `CraftIcon`/`CategoryMosaic`, Product
 * Manager's own category picker) reads through the same resolver, so
 * changes here are reflected immediately - see `MASTER_HANDOFF.md` for
 * the full list of updated call sites.
 *
 * Unlike products, a category id is *referenced by* other records
 * (`Product.category`), so deleting one that's still assigned to at least
 * one product is blocked outright (not just warned) - `countProductsInCategory()`
 * is checked before the delete-confirmation modal ever opens, and the
 * list row shows the live count plus a lock icon instead of a delete
 * button when it's non-zero. This is a deliberately simpler, safer
 * choice than allowing the delete and leaving products pointing at a
 * category id that no longer resolves to anything.
 */
export function CategoryManager() {
  useSiteMeta(PAGE_META.adminCategories);
  const { categories, isOverridden, countProductsInCategory, save, remove, reset } = useCategories();

  const [modal, setModal] = useState<ModalState>(null);
  const [form, setForm] = useState<FormState>(blankForm);
  const [errors, setErrors] = useState<CategoryFormErrors>({});
  const [pendingDelete, setPendingDelete] = useState<Category | null>(null);

  const usageById = useMemo(
    () => Object.fromEntries(categories.map((c) => [c.id, countProductsInCategory(c.id)])),
    [categories, countProductsInCategory],
  );

  function openCreate() {
    setForm(blankForm());
    setErrors({});
    setModal({ mode: "create" });
  }

  function openEdit(category: Category) {
    setForm(formFromCategory(category));
    setErrors({});
    setModal({ mode: "edit", category });
  }

  const closeModal = useCallback(() => {
    setModal(null);
  }, []);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!modal) return;

    const validationErrors = validateCategory(
      { label: form.label, description: form.description, icon: form.icon },
      ICON_NAMES,
    );
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    const id =
      modal.mode === "edit"
        ? modal.category.id
        : generateCategoryId(
            form.label,
            categories.map((c) => c.id),
          );

    save(buildCategory(form, id));
    setModal(null);
  }

  function requestDelete(category: Category) {
    if (usageById[category.id] > 0) return; // Guarded in the UI too - delete button is disabled in this case.
    setPendingDelete(category);
  }

  function confirmDelete() {
    if (!pendingDelete) return;
    remove(pendingDelete.id);
    setPendingDelete(null);
  }

  const closeDeleteModal = useCallback(() => {
    setPendingDelete(null);
  }, []);

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <SectionHeading eyebrow="Admin" title="Category Manager" align="left" />
        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            icon={<RotateCcw size={16} />}
            onClick={reset}
            disabled={!isOverridden}
          >
            Reset to defaults
          </Button>
          <Button type="button" size="sm" icon={<Plus size={16} />} onClick={openCreate}>
            Add category
          </Button>
        </div>
      </div>

      <p className="mt-4 text-sm text-ink-soft">
        {categories.length} {categories.length === 1 ? "category" : "categories"}
      </p>
      <p className="mt-1 text-sm text-ink-soft">
        A category still assigned to at least one product can&apos;t be deleted until it&apos;s
        reassigned or removed.
      </p>

      <Card padding="none" className="mt-3 overflow-hidden" data-testid="category-list">
        {categories.length === 0 ? (
          <EmptyState
            title="No categories yet"
            description="Add your first category to organize the catalog."
            actionLabel="Add category"
            onAction={openCreate}
          />
        ) : (
          <div className="flex flex-col divide-y divide-beige">
            {categories.map((category) => {
              const Icon = ICON_REGISTRY[category.icon] ?? ICON_REGISTRY.Package;
              const inUse = usageById[category.id] ?? 0;
              return (
                <div key={category.id} className="flex items-center gap-4 p-4">
                  <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md"
                    style={{
                      backgroundColor:
                        category.tone === "primary" ? "var(--color-denim-tint)" : "var(--color-bloom-tint)",
                    }}
                  >
                    <Icon
                      size={22}
                      color={category.tone === "primary" ? "var(--color-denim)" : "var(--color-bloom)"}
                      strokeWidth={1.6}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-ink">{category.label}</p>
                    <p className="truncate text-xs text-ink-soft">{category.description}</p>
                  </div>
                  <p className="hidden shrink-0 text-sm text-ink-soft sm:block">
                    {inUse} {inUse === 1 ? "product" : "products"}
                  </p>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openEdit(category)}
                      aria-label={`Edit ${category.label}`}
                      className="rounded-md border-2 border-beige p-1.5 text-ink-soft transition-colors hover:border-denim/40 hover:text-denim"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => requestDelete(category)}
                      disabled={inUse > 0}
                      aria-label={
                        inUse > 0
                          ? `Can't delete ${category.label} - still assigned to ${inUse} ${inUse === 1 ? "product" : "products"}`
                          : `Delete ${category.label}`
                      }
                      title={inUse > 0 ? "Reassign or remove its products first" : undefined}
                      className="rounded-md border-2 border-beige p-1.5 text-ink-soft transition-colors hover:border-error/60 hover:text-error disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-beige disabled:hover:text-ink-soft"
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

      <Modal
        isOpen={modal !== null}
        onClose={closeModal}
        title={modal?.mode === "edit" ? "Edit category" : "Add category"}
        size="md"
      >
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
          {modal?.mode === "edit" && (
            <Input label="Category ID" value={form.id} disabled hint="Not editable." />
          )}

          <Input
            label="Name"
            value={form.label}
            onChange={(e) => updateField("label", e.target.value)}
            error={errors.label}
          />

          <Textarea
            label="Description"
            value={form.description}
            onChange={(e) => updateField("description", e.target.value)}
            error={errors.description}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label="Icon"
              value={form.icon}
              onChange={(e) => updateField("icon", e.target.value)}
            >
              {ICON_NAMES.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </Select>
            <Select
              label="Accent tone"
              value={form.tone}
              onChange={(e) => updateField("tone", e.target.value as FormState["tone"])}
            >
              <option value="primary">Primary</option>
              <option value="accent">Accent</option>
            </Select>
          </div>
          {errors.icon && <p className="-mt-3 text-sm text-error">{errors.icon}</p>}

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              type="number"
              min="0"
              step="1"
              label="Item count"
              value={form.itemCount}
              onChange={(e) => updateField("itemCount", e.target.value)}
              hint="Display count shown on category cards."
            />
            <Input
              label="Image URL"
              value={form.image}
              onChange={(e) => updateField("image", e.target.value)}
              placeholder="https://..."
              hint="Optional - falls back to the illustrated icon."
            />
          </div>

          <label className="flex items-center gap-3 text-sm text-ink">
            <input
              type="checkbox"
              checked={form.featured}
              onChange={(e) => updateField("featured", e.target.checked)}
              className="h-4 w-4 rounded border-2 border-beige accent-denim"
            />
            Featured
          </label>

          <div className="flex items-center gap-3 pt-2">
            <Button type="submit">{modal?.mode === "edit" ? "Save changes" : "Add category"}</Button>
            <Button type="button" variant="ghost" onClick={closeModal}>
              Cancel
            </Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={pendingDelete !== null} onClose={closeDeleteModal} title="Delete category" size="sm">
        <p className="text-sm text-ink-soft">
          Delete <span className="font-medium text-ink">{pendingDelete?.label}</span>? This can&apos;t be
          undone from this page (use Reset to defaults to restore the original category list).
        </p>
        <div className="mt-6 flex items-center gap-3">
          <Button type="button" variant="danger" onClick={confirmDelete}>
            Delete
          </Button>
          <Button type="button" variant="ghost" onClick={() => setPendingDelete(null)}>
            Cancel
          </Button>
        </div>
      </Modal>

      {categories.some((c) => usageById[c.id] > 0) && (
        <p className="mt-6 flex items-start gap-2 text-xs text-ink-soft">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
          Categories with products assigned are locked from deletion until those products are
          reassigned to a different category or removed in Product Manager.
        </p>
      )}
    </div>
  );
}
