import { Link } from "react-router-dom";
import { Star } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { CraftIcon } from "@/components/ui/CraftIcon";
import { WishlistButton } from "@/components/ui/WishlistButton";
import { cn } from "@/lib/cn";
import { formatPHP } from "@/lib/currency";
import type { Product } from "@/types/product";

interface ProductCardProps {
  product: Product;
  /** Shown as a small ranked ribbon, e.g. for a best-sellers grid. */
  rank?: number;
  className?: string;
}

/**
 * Product teaser card. Links to the product detail page (Phase 4).
 */
export function ProductCard({ product, rank, className }: ProductCardProps) {
  return (
    <Link
      to={`/shop/${product.id}`}
      className={cn("group block rounded-lg focus-visible:outline-none", className)}
    >
      <Card
        hoverable
        padding="none"
        className="flex h-full flex-col overflow-hidden group-focus-visible:ring-2 group-focus-visible:ring-denim"
      >
        <div
          className="relative w-full overflow-hidden bg-beige/50"
          style={{ aspectRatio: "1 / 1" }}
        >
          {product.images?.[0] ? (
            <img
              src={product.images[0]}
              alt={product.name}
              className="absolute inset-0 block h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-105"
              style={{ objectFit: "cover", objectPosition: "center" }}
            />
          ) : (
            <CraftIcon
              category={product.category}
              className="h-full w-full p-8 transition-transform duration-300 ease-out group-hover:scale-105"
              iconClassName="h-10 w-10"
            />
          )}
          {typeof rank === "number" && (
            <span className="absolute left-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-bloom text-xs font-bold text-surface shadow-soft">
              #{rank}
            </span>
          )}
          <div className="absolute right-3 top-3 flex flex-col items-end gap-2">
            {product.tag && (
              <span className="rounded-full bg-denim px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-surface shadow-soft">
                {product.tag}
              </span>
            )}
            <WishlistButton productId={product.id} productName={product.name} size="sm" />
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-1 p-4">
          <h3 className="line-clamp-2 font-semibold text-ink">{product.name}</h3>
          <div className="flex items-center gap-1 text-sm text-ink-soft">
            <Star size={14} className="fill-bloom text-bloom" />
            {product.rating.toFixed(1)}
          </div>
          <p className="mt-1 font-display text-lg text-denim-deep">
            {formatPHP(product.price)}
          </p>
        </div>
      </Card>
    </Link>
  );
}
