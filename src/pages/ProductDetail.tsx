import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ChevronRight, Check, Expand, Star } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { CraftIcon } from "@/components/ui/CraftIcon";
import { Lightbox } from "@/components/ui/Lightbox";
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
import { isLowStock, isOutOfStock, maxPurchasableQuantity } from "@/lib/inventory";
import { useCart } from "@/context/CartContext";
import { EMPTY_STATES, ERROR_STATES, LOADING } from "@/content/states";
import { useSiteMeta } from "@/hooks/useSiteMeta";
import type { Product } from "@/types/product";

type FetchStatus = "loading" | "success" | "error";

export function ProductDetail() {
  const { id = "" } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { items, addItem } = useCart();

  const [status, setStatus] = useState<FetchStatus>("loading");
  const [product, setProduct] = useState<Product | undefined>(undefined);
  const [catalog, setCatalog] = useState<Product[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);
  const [isImageOpen, setIsImageOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

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
    const alreadyInCart = items.find((item) => item.productId === product.id)?.quantity ?? 0;
    const maxQty = maxPurchasableQuantity(product, alreadyInCart);
    if (maxQty <= 0) return;
    addItem(product.id, Math.min(quantity, maxQty));
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

  const alreadyInCart = items.find((item) => item.productId === product.id)?.quantity ?? 0;
  const maxQty = maxPurchasableQuantity(product, alreadyInCart);
  const outOfStock = isOutOfStock(product);
  const lowStock = isLowStock(product);
  const atCartLimit = !outOfStock && maxQty <= 0;
  const canAddToCart = maxQty > 0;

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
        {/*
         * Image / illustration. Renders the real product image when one
         * exists (bug fix: this previously always rendered the CraftIcon
         * placeholder even for a product with a real photo, unlike
         * ProductCard's grid tile, which already handled this correctly).
         * Cropped to a square here to match the grid tile's framing, but
         * clicking it opens the same image uncropped, at its true aspect
         * ratio, in a lightbox - `object-contain` there instead of
         * `object-cover`.
         */}
        <div className="relative aspect-square w-full rounded-lg bg-beige/50">
          {product.images?.[0] ? (
            <button
              type="button"
              onClick={() => {
                setLightboxIndex(0);
                setIsImageOpen(true);
              }}
              className="group block h-full w-full overflow-hidden rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim"
              aria-label={`View full-size image of ${product.name}`}
            >
              <img
                src={product.images[0]}
                alt={product.name}
                className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-105"
              />
              <span className="absolute bottom-4 right-4 flex items-center gap-1.5 rounded-full bg-ink/60 px-3 py-1.5 text-xs font-semibold text-surface opacity-0 backdrop-blur-sm transition-opacity duration-200 group-hover:opacity-100">
                <Expand size={14} aria-hidden="true" />
                View full size
              </span>
            </button>
          ) : (
            <CraftIcon
              category={product.category}
              className="h-full w-full p-16"
              iconClassName="h-20 w-20"
            />
          )}
          {product.tag && (
            <span className="absolute right-4 top-4 rounded-full bg-denim px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-surface shadow-soft">
              {product.tag}
            </span>
          )}
          {outOfStock && (
            <span className="absolute left-4 top-4 rounded-full bg-ink/80 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-surface shadow-soft">
              Out of stock
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
          {lowStock && (
            <p className="mt-1 text-sm font-medium text-error">Only {product.stock} left in stock</p>
          )}

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
            {canAddToCart && (
              <QuantityStepper
                value={Math.min(quantity, maxQty)}
                onChange={setQuantity}
                max={maxQty}
                label={`quantity of ${product.name}`}
              />
            )}
            <Button size="lg" onClick={handleAddToCart} className="flex-1 sm:flex-none" disabled={!canAddToCart}>
              {outOfStock ? "Out of stock" : atCartLimit ? "Max in cart" : "Add to cart"}
            </Button>
            <WishlistButton productId={product.id} productName={product.name} size="md" />
          </div>

          {atCartLimit && (
            <p className="mt-3 text-sm text-ink-soft">
              You already have all {product.stock} available in your cart.
            </p>
          )}

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

      {product.images && product.images.length > 0 && (
        <Lightbox
          isOpen={isImageOpen}
          onClose={() => setIsImageOpen(false)}
          images={product.images}
          index={lightboxIndex}
          onIndexChange={setLightboxIndex}
          alt={product.name}
        />
      )}
    </div>
  );
}
