import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { ProductCard } from "@/components/ui/ProductCard";
import { ProductGridSkeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/StateMessage";
import { Squiggle } from "@/components/ui/Squiggle";
import { CategoryFilter } from "@/components/shop/CategoryFilter";
import { SortSelect } from "@/components/shop/SortSelect";
import { resolveAllCategories } from "@/lib/categoriesStore";
import { apiGetProducts } from "@/lib/api/products";
import { setProductsCache } from "@/lib/productsStore";
import { filterAndSortProducts } from "@/lib/productFilters";
import type { CraftCategory, Product, SortOption } from "@/types/product";
import { EMPTY_STATES, ERROR_STATES, LOADING } from "@/content/states";
import { PAGE_META } from "@/config/site";
import { useSiteMeta } from "@/hooks/useSiteMeta";
import { SHOP_SETTINGS } from "@/config/layouts/shop";
import { cn } from "@/lib/cn";

const VALID_SORTS: SortOption[] = ["featured", "best-selling", "newest", "price-asc", "price-desc"];

type FetchStatus = "loading" | "success" | "error";

export function Shop() {
  useSiteMeta(PAGE_META.shop);
  const [searchParams, setSearchParams] = useSearchParams();
  const [status, setStatus] = useState<FetchStatus>("loading");
  const [products, setProducts] = useState<Product[]>([]);

  // Resolved once per mount (not reactive to admin edits mid-visit, same
  // reasoning as the product fetch below) - Shop isn't mounted while an
  // admin is on /admin/categories, so a fresh mount already picks up any
  // Category Manager save.
  const categories = useMemo(() => resolveAllCategories(), []);
  const validCategories = useMemo<(CraftCategory | "all")[]>(
    () => ["all", ...categories.map((c) => c.id)],
    [categories],
  );
  const categoryTitle = useMemo<Record<CraftCategory, string>>(
    () => Object.fromEntries(categories.map((c) => [c.id, c.label])),
    [categories],
  );

  const rawCategory = searchParams.get("category") ?? "all";
  const category = validCategories.includes(rawCategory as CraftCategory | "all")
    ? (rawCategory as CraftCategory | "all")
    : "all";

  const rawSort = searchParams.get("sort") ?? SHOP_SETTINGS.defaultSort;
  const sort = VALID_SORTS.includes(rawSort as SortOption) ? (rawSort as SortOption) : SHOP_SETTINGS.defaultSort;

  const query = searchParams.get("q") ?? "";
  const [searchInput, setSearchInput] = useState(query);

  // Keep the local search box in sync when the URL changes from elsewhere
  // (e.g. the Navbar's search, or a Footer link that resets everything).
  useEffect(() => {
    setSearchInput(query);
  }, [query]);

  const loadProducts = useCallback(() => {
    setStatus("loading");
    apiGetProducts()
      .then((data) => {
        setProducts(data);
        setProductsCache(data);
        setStatus("success");
      })
      .catch(() => setStatus("error"));
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const results = useMemo(
    () => filterAndSortProducts(products, { category, query, sort }),
    [products, category, query, sort],
  );

  const hasActiveFilters = category !== "all" || query.trim().length > 0;

  function updateParams(updates: Record<string, string | null>) {
    const next = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries(updates)) {
      if (value === null || value === "") {
        next.delete(key);
      } else {
        next.set(key, value);
      }
    }
    setSearchParams(next, { replace: true });
  }

  function handleSearchSubmit(e: FormEvent) {
    e.preventDefault();
    updateParams({ q: searchInput.trim() || null });
  }

  function clearFilters() {
    setSearchInput("");
    setSearchParams({}, { replace: true });
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex flex-col items-center text-center">
        <span className="mb-2 text-xs font-bold uppercase tracking-[0.15em] text-bloom-deep">
          Shop
        </span>
        <h1 className="font-display text-3xl text-ink sm:text-4xl">
          {category === "all" ? "All Products" : categoryTitle[category]}
        </h1>
        <Squiggle className="my-4" />
        <p className="max-w-xl text-ink-soft">
          Every piece made in small batches. Filter by craft, search for something
          specific, or sort to find what&apos;s new.
        </p>
      </div>

      <div className="mt-10 flex flex-col gap-4">
        {SHOP_SETTINGS.showSearch && (
        <form onSubmit={handleSearchSubmit} className="mx-auto w-full max-w-md">
          <div className="relative">
            <Input
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search products..."
              aria-label="Search products"
              className="pl-10 pr-10"
            />
            <Search
              size={18}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-soft"
              aria-hidden="true"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => {
                  setSearchInput("");
                  updateParams({ q: null });
                }}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft hover:text-denim"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </form>
        )}

        {(SHOP_SETTINGS.showCategoryFilter || SHOP_SETTINGS.showSort) && (
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          {SHOP_SETTINGS.showCategoryFilter && (
          <CategoryFilter
            value={category}
            onChange={(next) => updateParams({ category: next === "all" ? null : next })}
            className="w-full sm:w-auto"
          />
          )}
          {SHOP_SETTINGS.showSort && (
          <SortSelect
            value={sort}
            onChange={(next) => updateParams({ sort: next === SHOP_SETTINGS.defaultSort ? null : next })}
          />
          )}
        </div>
        )}
      </div>

      <div className="mt-8">
        {status === "loading" && (
          <>
            <span className="sr-only" role="status">{LOADING.defaultLabel}</span>
            <ProductGridSkeleton count={8} />
          </>
        )}

        {status === "error" && (
          <ErrorState {...ERROR_STATES.shop} onAction={loadProducts} />
        )}

        {status === "success" && results.length === 0 && (
          <EmptyState
            {...(query ? EMPTY_STATES.shopNoResultsQuery(query) : EMPTY_STATES.shopNoResults)}
            actionLabel={hasActiveFilters ? "Clear filters" : undefined}
            onAction={hasActiveFilters ? clearFilters : undefined}
          />
        )}

        {status === "success" && results.length > 0 && (
          <>
            <p className="mb-4 text-sm text-ink-soft">
              {results.length} {results.length === 1 ? "piece" : "pieces"}
              {query && <> matching &ldquo;{query}&rdquo;</>}
            </p>
            <div
              className={cn(
                "grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6",
                SHOP_SETTINGS.desktopColumns === 3 && "lg:grid-cols-3",
                SHOP_SETTINGS.desktopColumns === 4 && "lg:grid-cols-4",
                SHOP_SETTINGS.desktopColumns === 5 && "lg:grid-cols-5",
              )}
            >
              {results.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
