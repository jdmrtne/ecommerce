import { useCallback, useEffect, useState } from "react";
import { ProductCard } from "@/components/ui/ProductCard";
import { ProductCardSkeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/StateMessage";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { useInView } from "@/hooks/useInView";
import { apiGetProducts } from "@/lib/api/products";
import { deriveBestSellers, setProductsCache } from "@/lib/productsStore";
import { ERROR_STATES } from "@/content/states";
import { BEST_SELLERS_SECTION } from "@/content/homepage";
import type { Product } from "@/types/product";
import type { SectionOverrideProps } from "@/types/layout";
import { backgroundClass, paddingClass, resolveSectionSettings, widthClass } from "@/lib/sectionStyle";
import { cn } from "@/lib/cn";

const DEFAULT_SETTINGS = { padding: "lg", background: "transparent", width: "default", align: "center" } as const;

type FetchStatus = "loading" | "success" | "error";

/** Phase 27 - Products (Backend-Integrated). See `FeaturedProducts.tsx`'s doc comment for the shared fetch/skeleton/error pattern every homepage product section now follows. */
export function BestSellers({ title, subtitle, settings }: SectionOverrideProps) {
  const { ref, isInView } = useInView<HTMLDivElement>();
  const s = resolveSectionSettings(DEFAULT_SETTINGS, settings);
  const [status, setStatus] = useState<FetchStatus>("loading");
  const [products, setProducts] = useState<Product[]>([]);

  const load = useCallback(() => {
    setStatus("loading");
    apiGetProducts()
      .then((data) => {
        setProducts(deriveBestSellers(data));
        setProductsCache(data);
        setStatus("success");
      })
      .catch(() => setStatus("error"));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <section className={cn("mx-auto px-4 sm:px-6 lg:px-8", paddingClass(s), backgroundClass(s), widthClass(s))}>
      <SectionHeading
        eyebrow={BEST_SELLERS_SECTION.eyebrow}
        title={title ?? BEST_SELLERS_SECTION.title}
        description={subtitle ?? BEST_SELLERS_SECTION.description}
        align={s.align}
      />

      {status === "error" && (
        <div className="mt-10">
          <ErrorState {...ERROR_STATES.shop} onAction={load} />
        </div>
      )}

      {status !== "error" && (
        <div ref={ref} className="mt-10 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          {status === "loading"
            ? Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)
            : products.map((product, i) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  rank={i + 1}
                  className={isInView ? "animate-fade-up" : "opacity-0"}
                />
              ))}
        </div>
      )}
    </section>
  );
}
