import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { ProductCard } from "@/components/ui/ProductCard";
import { ProductCardSkeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/StateMessage";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { apiGetProducts } from "@/lib/api/products";
import { deriveFeaturedProducts, setProductsCache } from "@/lib/productsStore";
import { ERROR_STATES } from "@/content/states";
import { FEATURED_SECTION } from "@/content/homepage";
import type { Product } from "@/types/product";
import type { SectionOverrideProps } from "@/types/layout";
import { backgroundClass, paddingClass, resolveSectionSettings, widthClass } from "@/lib/sectionStyle";
import { cn } from "@/lib/cn";

const DEFAULT_SETTINGS = { padding: "lg", background: "beige", width: "default", align: "left" } as const;

type FetchStatus = "loading" | "success" | "error";

/**
 * Phase 27 - Products (Backend-Integrated). Fetches the live catalog
 * itself (rather than reading a shared cache) and re-derives the
 * featured list with `deriveFeaturedProducts()` - same independent-fetch
 * pattern `BestSellers`/`NewArrivals` use, so each homepage section
 * degrades on its own rather than one failed request blanking the whole
 * page. The outer `<section>` always renders (skeleton while loading,
 * `ErrorState` on failure) so the section count `Home.test.tsx` asserts
 * stays stable regardless of fetch status.
 */
export function FeaturedProducts({ title, settings }: SectionOverrideProps) {
  const s = resolveSectionSettings(DEFAULT_SETTINGS, settings);
  const [status, setStatus] = useState<FetchStatus>("loading");
  const [products, setProducts] = useState<Product[]>([]);

  const load = useCallback(() => {
    setStatus("loading");
    apiGetProducts()
      .then((data) => {
        setProducts(deriveFeaturedProducts(data));
        setProductsCache(data);
        setStatus("success");
      })
      .catch(() => setStatus("error"));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <section className={cn(paddingClass(s), backgroundClass(s))}>
      <div className={cn("mx-auto px-4 sm:px-6 lg:px-8", widthClass(s))}>
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row sm:items-end">
          <SectionHeading
            align={s.align}
            eyebrow={FEATURED_SECTION.eyebrow}
            title={title ?? FEATURED_SECTION.title}
            className="sm:text-left"
          />
          <Link
            to="/shop"
            className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-denim hover:text-denim-deep"
          >
            {FEATURED_SECTION.viewAllLabel}
            <ArrowRight size={16} />
          </Link>
        </div>

        {status === "error" && (
          <div className="mt-8">
            <ErrorState {...ERROR_STATES.shop} onAction={load} />
          </div>
        )}

        {status !== "error" && (
          <div className="mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 [scrollbar-width:thin]">
            {status === "loading"
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="w-56 shrink-0 sm:w-64">
                    <ProductCardSkeleton />
                  </div>
                ))
              : products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    className="w-56 shrink-0 snap-start sm:w-64"
                  />
                ))}
          </div>
        )}
      </div>
    </section>
  );
}
