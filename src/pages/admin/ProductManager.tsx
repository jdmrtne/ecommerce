import { useCallback, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Plus, Pencil, Trash2, Search, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input, Textarea } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { CraftIcon } from "@/components/ui/CraftIcon";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { EmptyState, ErrorState } from "@/components/ui/StateMessage";
import { Skeleton } from "@/components/ui/Skeleton";
import { AssetPicker } from "@/components/admin/AssetPicker";
import { formatPHP } from "@/lib/currency";
import { isLowStock, isOutOfStock } from "@/lib/inventory";
import { resolveAllCategories } from "@/lib/categoriesStore";
import { generateProductId } from "@/lib/productsStore";
import { validateProduct } from "@/lib/productValidation";
import type { ProductFormErrors } from "@/lib/productValidation";
import { useProducts } from "@/hooks/useProducts";
import { PAGE_META } from "@/config/site";
import { useSiteMeta } from "@/hooks/useSiteMeta";
import { ERROR_STATES } from "@/content/states";
import type { Product, ProductVariant } from "@/types/product";

interface VariantFormRow {
  name: string;
  optionsText: string;
}

interface FormState {
  id: string;
  name: string;
  category: string;
  price: string;
  rating: string;
  tag: "" | "New" | "Limited";
  createdAt: string;
  salesRank: string;
  description: string;
  details: string[];
  images: string[];
  stock: string;
  tagsText: string;
  variants: VariantFormRow[];
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function blankForm(): FormState {
  return {
    id: "",
    name: "",
    category: resolveAllCategories()[0]?.id ?? "",
    price: "",
    rating: "5",
    tag: "",
    createdAt: today(),
    salesRank: "",
    description: "",
    details: [],
    images: [],
    stock: "",
    tagsText: "",
    variants: [],
  };
}

function formFromProduct(product: Product): FormState {
  return {
    id: product.id,
    name: product.name,
    category: product.category,
    price: String(product.price),
    rating: String(product.rating),
    tag: product.tag ?? "",
    createdAt: product.createdAt,
    salesRank: product.salesRank !== undefined ? String(product.salesRank) : "",
    description: product.description,
    details: product.details ? [...product.details] : [],
    images: product.images ? [...product.images] : [],
    stock: product.stock !== undefined ? String(product.stock) : "",
    tagsText: product.tags ? product.tags.join(", ") : "",
    variants: (product.variants ?? []).map((v) => ({ name: v.name, optionsText: v.options.join(", ") })),
  };
}

/** Builds the `Product` this form describes, given the id to save it under. */
function buildProduct(form: FormState, id: string): Product {
  const details = form.details.map((d) => d.trim()).filter(Boolean);
  const images = form.images.map((i) => i.trim()).filter(Boolean);
  const tags = form.tagsText
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  const variants: ProductVariant[] = form.variants
    .map((v) => ({
      name: v.name.trim(),
      options: v.optionsText
        .split(",")
        .map((o) => o.trim())
        .filter(Boolean),
    }))
    .filter((v) => v.name && v.options.length > 0);

  return {
    id,
    name: form.name.trim(),
    category: form.category,
    price: Number(form.price),
    rating: Number(form.rating),
    tag: form.tag || undefined,
    createdAt: form.createdAt || today(),
    salesRank: form.salesRank.trim() ? Number(form.salesRank) : undefined,
    description: form.description.trim(),
    details: details.length > 0 ? details : undefined,
    images: images.length > 0 ? images : undefined,
    stock: form.stock.trim() ? Number(form.stock) : undefined,
    tags: tags.length > 0 ? tags : undefined,
    variants: variants.length > 0 ? variants : undefined,
  };
}

type ModalState = { mode: "create" } | { mode: "edit"; product: Product } | null;

/**
 * Phase 19 - Product Manager. Admin CRUD for the product catalog,
 * originally replacing direct edits to `data/products.ts` via a
 * `localStorage` override. As of Phase 27 (Products, Backend-Integrated),
 * `hooks/useProducts.ts` reads/writes through `lib/api/products.ts`
 * against the real backend instead - saves/deletes are real network
 * requests, so the list now has its own loading/error state, and there's
 * no more "reset to defaults" (there's no static default to reset to
 * once the catalog lives in the database). Every storefront consumer
 * (`Shop.tsx`, `ProductDetail.tsx`, the homepage `FeaturedProducts`/
 * `BestSellers`/`NewArrivals` sections) now fetches the same backend
 * directly too - see `MASTER_HANDOFF.md` for the full list of updated
 * call sites.
 *
 * Unlike Store Settings/Theme/Homepage (one form editing one object),
 * this page is a list + a create/edit modal, since a catalog is a
 * collection of records rather than a single settings object. The
 * category filter/search here are independent of Shop's own filtering
 * (`lib/productFilters.ts`) - this list is for finding a product to
 * manage, not for a storefront browsing experience.
 */
export function ProductManager() {
  useSiteMeta(PAGE_META.adminProducts);
  const { products, status, reload, save, remove } = useProducts();

  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [modal, setModal] = useState<ModalState>(null);
  const [form, setForm] = useState<FormState>(blankForm);
  const [errors, setErrors] = useState<ProductFormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Product | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const categories = useMemo(() => resolveAllCategories(), []);
  const categoryLabel = useMemo(
    () => Object.fromEntries(categories.map((c) => [c.id, c.label])),
    [categories],
  );

  const filtered = useMemo(() => {
    const trimmedQuery = query.trim().toLowerCase();
    return products.filter((p) => {
      const matchesCategory = categoryFilter === "all" || p.category === categoryFilter;
      const matchesQuery =
        trimmedQuery === "" ||
        p.name.toLowerCase().includes(trimmedQuery) ||
        p.id.toLowerCase().includes(trimmedQuery);
      return matchesCategory && matchesQuery;
    });
  }, [products, query, categoryFilter]);

  function openCreate() {
    setForm(blankForm());
    setErrors({});
    setSubmitError(null);
    setModal({ mode: "create" });
  }

  function openEdit(product: Product) {
    setForm(formFromProduct(product));
    setErrors({});
    setSubmitError(null);
    setModal({ mode: "edit", product });
  }

  const closeModal = useCallback(() => {
    setModal(null);
  }, []);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function updateListRow(field: "details" | "images", index: number, value: string) {
    setForm((prev) => ({
      ...prev,
      [field]: prev[field].map((row, i) => (i === index ? value : row)),
    }));
  }

  function addListRow(field: "details" | "images") {
    setForm((prev) => ({ ...prev, [field]: [...prev[field], ""] }));
  }

  function removeListRow(field: "details" | "images", index: number) {
    setForm((prev) => ({ ...prev, [field]: prev[field].filter((_, i) => i !== index) }));
  }

  function updateVariant(index: number, field: keyof VariantFormRow, value: string) {
    setForm((prev) => ({
      ...prev,
      variants: prev.variants.map((row, i) => (i === index ? { ...row, [field]: value } : row)),
    }));
  }

  function addVariant() {
    setForm((prev) => ({ ...prev, variants: [...prev.variants, { name: "", optionsText: "" }] }));
  }

  function removeVariant(index: number) {
    setForm((prev) => ({ ...prev, variants: prev.variants.filter((_, i) => i !== index) }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!modal) return;

    const validationErrors = validateProduct({
      name: form.name,
      category: form.category,
      price: Number(form.price),
      rating: Number(form.rating),
      description: form.description,
      stock: form.stock.trim() ? Number(form.stock) : undefined,
    });
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    const id =
      modal.mode === "edit"
        ? modal.product.id
        : generateProductId(
            form.name,
            products.map((p) => p.id),
          );

    setSubmitError(null);
    try {
      await save(buildProduct(form, id));
      setModal(null);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Something went wrong saving this product.");
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setDeleteError(null);
    try {
      await remove(pendingDelete.id);
      setPendingDelete(null);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Something went wrong deleting this product.");
    }
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <SectionHeading eyebrow="Admin" title="Product Manager" align="left" />
        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" size="sm" icon={<Plus size={16} />} onClick={openCreate} disabled={status !== "success"}>
            Add product
          </Button>
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or id..."
            aria-label="Search products"
            className="pl-10"
          />
          <Search
            size={18}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-soft"
            aria-hidden="true"
          />
        </div>
        <Select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          aria-label="Filter by category"
          className="sm:w-56"
        >
          <option value="all">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </Select>
      </div>

      {status === "success" && (
        <p className="mt-4 text-sm text-ink-soft">
          {filtered.length} of {products.length} {products.length === 1 ? "product" : "products"}
        </p>
      )}

      <Card padding="none" className="mt-3 overflow-hidden" data-testid="product-list">
        {status === "loading" && (
          <div className="flex flex-col divide-y divide-beige">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4">
                <Skeleton className="h-12 w-12 shrink-0 rounded-md" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-1/3" />
                </div>
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        )}

        {status === "error" && <ErrorState {...ERROR_STATES.adminProducts} onAction={reload} />}

        {status === "success" && filtered.length === 0 && (
          <EmptyState
            title="No products found"
            description="Try a different search or category, or add a new product."
            actionLabel={products.length === 0 ? "Add product" : undefined}
            onAction={products.length === 0 ? openCreate : undefined}
          />
        )}

        {status === "success" && filtered.length > 0 && (
          <div className="flex flex-col divide-y divide-beige">
            {filtered.map((product) => (
              <div key={product.id} className="flex items-center gap-4 p-4">
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md bg-beige/50">
                  {product.images?.[0] ? (
                    <img src={product.images[0]} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <CraftIcon category={product.category} className="h-full w-full p-2" iconClassName="h-5 w-5" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-ink">{product.name}</p>
                  <p className="truncate text-xs text-ink-soft">
                    {categoryLabel[product.category] ?? product.category}
                    {product.tag && <> &middot; {product.tag}</>}
                  </p>
                </div>
                <p className="hidden shrink-0 text-sm text-ink-soft sm:block">
                  {product.rating.toFixed(1)} &#9733;
                </p>
                {typeof product.stock === "number" && (
                  <p
                    className={
                      isOutOfStock(product)
                        ? "hidden shrink-0 text-xs font-semibold text-error sm:block"
                        : isLowStock(product)
                          ? "hidden shrink-0 text-xs font-semibold text-bloom-deep sm:block"
                          : "hidden shrink-0 text-xs text-ink-soft sm:block"
                    }
                  >
                    {isOutOfStock(product) ? "Out of stock" : `${product.stock} in stock`}
                  </p>
                )}
                <p className="shrink-0 font-display text-base text-denim-deep">{formatPHP(product.price)}</p>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => openEdit(product)}
                    aria-label={`Edit ${product.name}`}
                    className="rounded-md border-2 border-beige p-1.5 text-ink-soft transition-colors hover:border-denim/40 hover:text-denim"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPendingDelete(product)}
                    aria-label={`Delete ${product.name}`}
                    className="rounded-md border-2 border-beige p-1.5 text-ink-soft transition-colors hover:border-error/60 hover:text-error"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Modal
        isOpen={modal !== null}
        onClose={closeModal}
        title={modal?.mode === "edit" ? "Edit product" : "Add product"}
        size="lg"
      >
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
          {modal?.mode === "edit" && (
            <Input label="Product ID" value={form.id} disabled hint="Not editable." />
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Name"
              value={form.name}
              onChange={(e) => updateField("name", e.target.value)}
              error={errors.name}
            />
            <Select
              label="Category"
              value={form.category}
              onChange={(e) => updateField("category", e.target.value)}
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </Select>
          </div>
          {errors.category && <p className="-mt-3 text-sm text-error">{errors.category}</p>}

          <div className="grid gap-4 sm:grid-cols-3">
            <Input
              type="number"
              min="0"
              step="1"
              label="Price (PHP)"
              value={form.price}
              onChange={(e) => updateField("price", e.target.value)}
              error={errors.price}
            />
            <Input
              type="number"
              min="0"
              max="5"
              step="0.1"
              label="Rating"
              value={form.rating}
              onChange={(e) => updateField("rating", e.target.value)}
              error={errors.rating}
            />
            <Select label="Tag" value={form.tag} onChange={(e) => updateField("tag", e.target.value as FormState["tag"])}>
              <option value="">None</option>
              <option value="New">New</option>
              <option value="Limited">Limited</option>
            </Select>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Input
              type="date"
              label="Date added"
              value={form.createdAt}
              onChange={(e) => updateField("createdAt", e.target.value)}
              hint="Drives the Newest sort and New Arrivals."
            />
            <Input
              type="number"
              min="1"
              step="1"
              label="Sales rank"
              value={form.salesRank}
              onChange={(e) => updateField("salesRank", e.target.value)}
              hint="Leave blank unless it's a best seller."
            />
            <Input
              type="number"
              min="0"
              step="1"
              label="Stock"
              value={form.stock}
              onChange={(e) => updateField("stock", e.target.value)}
              error={errors.stock}
              hint="Leave blank for unlimited/untracked stock. Set to 0 to mark as out of stock."
            />
          </div>

          <Textarea
            label="Description"
            value={form.description}
            onChange={(e) => updateField("description", e.target.value)}
            error={errors.description}
          />

          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-ink">Detail bullets</p>
            {form.details.map((detail, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  value={detail}
                  onChange={(e) => updateListRow("details", index, e.target.value)}
                  aria-label={`Detail line ${index + 1}`}
                  className="flex-1"
                />
                <button
                  type="button"
                  onClick={() => removeListRow("details", index)}
                  aria-label={`Remove detail line ${index + 1}`}
                  className="rounded-md border-2 border-beige p-2 text-ink-soft hover:border-error/60 hover:text-error"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" icon={<Plus size={16} />} onClick={() => addListRow("details")} className="self-start">
              Add detail line
            </Button>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-ink">Images</p>
            {form.images.map((image, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  value={image}
                  onChange={(e) => updateListRow("images", index, e.target.value)}
                  aria-label={`Image URL ${index + 1}`}
                  placeholder="https://..."
                  className="flex-1"
                />
                <AssetPicker
                  value={image || undefined}
                  onSelect={(url) => updateListRow("images", index, url)}
                  label="Browse"
                />
                <button
                  type="button"
                  onClick={() => removeListRow("images", index)}
                  aria-label={`Remove image URL ${index + 1}`}
                  className="rounded-md border-2 border-beige p-2 text-ink-soft hover:border-error/60 hover:text-error"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" variant="outline" size="sm" icon={<Plus size={16} />} onClick={() => addListRow("images")} className="self-start">
                Add image URL
              </Button>
              <AssetPicker
                onSelect={(url) => setForm((prev) => ({ ...prev, images: [...prev.images, url] }))}
                label="Add from library"
              />
            </div>
            <p className="text-xs text-ink-soft">Leave empty to use the illustrated placeholder.</p>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-ink">Variants</p>
            {form.variants.map((variant, index) => (
              <div key={index} className="flex flex-wrap items-end gap-2">
                <div className="min-w-[8rem] flex-1">
                  <Input
                    label="Variant name"
                    value={variant.name}
                    onChange={(e) => updateVariant(index, "name", e.target.value)}
                    placeholder="Color"
                  />
                </div>
                <div className="min-w-[12rem] flex-[2]">
                  <Input
                    label="Options (comma-separated)"
                    value={variant.optionsText}
                    onChange={(e) => updateVariant(index, "optionsText", e.target.value)}
                    placeholder="Red, Blue, Green"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeVariant(index)}
                  aria-label={`Remove variant ${index + 1}`}
                  className="rounded-md border-2 border-beige p-2 text-ink-soft hover:border-error/60 hover:text-error"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" icon={<Plus size={16} />} onClick={addVariant} className="self-start">
              Add variant
            </Button>
          </div>

          <Input
            label="Search tags (comma-separated)"
            value={form.tagsText}
            onChange={(e) => updateField("tagsText", e.target.value)}
            hint="Free-form merchandising tags, separate from the New/Limited badge above."
          />

          {submitError && <p className="text-sm text-error">{submitError}</p>}

          <div className="flex items-center gap-3 pt-2">
            <Button type="submit">{modal?.mode === "edit" ? "Save changes" : "Add product"}</Button>
            <Button type="button" variant="ghost" onClick={closeModal}>
              Cancel
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={pendingDelete !== null}
        onClose={() => {
          setPendingDelete(null);
          setDeleteError(null);
        }}
        title="Delete product"
        size="sm"
      >
        <p className="text-sm text-ink-soft">
          Delete <span className="font-medium text-ink">{pendingDelete?.name}</span>? This can&apos;t be undone.
        </p>
        {deleteError && <p className="mt-3 text-sm text-error">{deleteError}</p>}
        <div className="mt-6 flex items-center gap-3">
          <Button type="button" variant="danger" onClick={confirmDelete}>
            Delete
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setPendingDelete(null);
              setDeleteError(null);
            }}
          >
            Cancel
          </Button>
        </div>
      </Modal>
    </div>
  );
}
