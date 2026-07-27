import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ChevronRight, Check, Star } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { CraftIcon } from "@/components/ui/CraftIcon";
import { ProductCard } from "@/components/ui/ProductCard";
import { QuantityStepper } from "@/components/ui/QuantityStepper";
import { WishlistButton } from "@/components/ui/WishlistButton";
import { ProductDetailSkeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/StateMessage";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { resolveCategoryById } from "@/lib/categoriesStore";
import { apiGetProducts } from "@/lib/api/products";
import { setProductsCache } from "@/lib/productsStore";
import { formatPHP } from "@/lib/currency";
import { useCart } from "@/context/CartContext";
import { EMPTY_STATES, ERROR_STATES, LOADING } from "@/content/states";
import { useSiteMeta } from "@/hooks/useSiteMeta";
import type { Product } from "@/types/product";

type FetchStatus = "loading" | "success" | "error";

export function ProductDetail() {
  const { id = "" } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addItem } = useCart();

  const [status, setStatus] = useState<FetchStatus>("loading");
  const [product, setProduct] = useState<Product | undefined>(undefined);
  const [catalog, setCatalog] = useState<Product[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);

  // Falls back to the not-found copy's title until the product loads, so
  // the tab title is never blank/stale mid-fetch.
  useSiteMeta({
    title: product?.name ?? "",
    description: product?.description,
  });

  // Fetches the whole catalog (not a single-product query) so "related
  // products" below can be derived from the same response, same shape as
  // the pre-backend simulated fetch this replaces.
  const loadProduct = useCallback(() => {
    setStatus("loading");
    apiGetProducts()
      .then((data) => {
        setCatalog(data);
        setProductsCache(data);
        setProduct(data.find((p) => p.id === id));
        setStatus("success");
      })
      .catch(() => setStatus("error"));
  }, [id]);

  useEffect(() => {
    loadProduct();
    setQuantity(1);
    setJustAdded(false);
  }, [loadProduct]);

  // Auto-dismiss the "Added to cart" confirmation after a few seconds.
  useEffect(() => {
    if (!justAdded) return;
    const timer = setTimeout(() => setJustAdded(false), 2500);
    return () => clearTimeout(timer);
  }, [justAdded]);

  function handleAddToCart() {
    if (!product) return;
    addItem(product.id, quantity);
    setJustAdded(true);
  }

  if (status === "loading") {
    return (
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <span className="sr-only" role="status">{LOADING.defaultLabel}</span>
        <ProductDetailSkeleton />
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <ErrorState {...ERROR_STATES.product} onAction={loadProduct} />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <EmptyState {...EMPTY_STATES.productNotFound} onAction={() => navigate("/shop")} />
      </div>
    );
  }

  const categoryMeta = resolveCategoryById(product.category);
  const related = catalog
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, 4);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-8 flex flex-wrap items-center gap-1.5 text-sm text-ink-soft">
        <Link to="/shop" className="hover:text-denim">
          Shop
        </Link>
        <ChevronRight size={14} aria-hidden="true" />
        <Link to={`/shop?category=${product.category}`} className="hover:text-denim">
          {categoryMeta?.label ?? product.category}
        </Link>
        <ChevronRight size={14} aria-hidden="true" />
        <span className="line-clamp-1 text-ink" aria-current="page">
          {product.name}
        </span>
      </nav>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-16">
        {/* Image / illustration */}
        <div className="relative aspect-square w-full rounded-lg bg-beige/50">
          <CraftIcon
            category={product.category}
            className="h-full w-full p-16"
            iconClassName="h-20 w-20"
          />
          {product.tag && (
            <span className="absolute right-4 top-4 rounded-full bg-denim px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-surface shadow-soft">
              {product.tag}
            </span>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col">
          <span className="mb-2 text-xs font-bold uppercase tracking-[0.15em] text-bloom-deep">
            {categoryMeta?.label ?? product.category}
          </span>
          <h1 className="font-display text-3xl text-ink sm:text-4xl">{product.name}</h1>

          <div className="mt-3 flex items-center gap-1.5 text-sm text-ink-soft">
            <Star size={16} className="fill-bloom text-bloom" />
            <span className="font-medium text-ink">{product.rating.toFixed(1)}</span>
            <span>rating</span>
          </div>

          <p className="mt-4 font-display text-2xl text-denim-deep">{formatPHP(product.price)}</p>

          <p className="mt-5 leading-relaxed text-ink-soft">{product.description}</p>

          {product.details && product.details.length > 0 && (
            <ul className="mt-5 flex flex-col gap-2">
              {product.details.map((detail) => (
                <li key={detail} className="flex items-start gap-2 text-sm text-ink-soft">
                  <Check size={16} className="mt-0.5 shrink-0 text-denim" aria-hidden="true" />
                  {detail}
                </li>
              ))}
            </ul>
          )}

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <QuantityStepper value={quantity} onChange={setQuantity} label={`quantity of ${product.name}`} />
            <Button size="lg" onClick={handleAddToCart} className="flex-1 sm:flex-none">
              Add to cart
            </Button>
            <WishlistButton productId={product.id} productName={product.name} size="md" />
          </div>

          <AnimatePresence>
            {justAdded && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-3 flex items-center gap-1.5 text-sm font-medium text-success"
                role="status"
              >
                <Check size={16} />
                Added {quantity} {quantity === 1 ? "piece" : "pieces"} to your cart.
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>

      {related.length > 0 && (
        <div className="mt-20">
          <SectionHeading
            eyebrow="More like this"
            title={categoryMeta?.label ?? "You may also like"}
            align="left"
          />
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-6">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
