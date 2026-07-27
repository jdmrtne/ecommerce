import { Heart } from "lucide-react";
import { cn } from "@/lib/cn";
import { useWishlist } from "@/context/WishlistContext";

interface WishlistButtonProps {
  productId: string;
  productName: string;
  size?: "sm" | "md";
  className?: string;
}

/**
 * Heart toggle used on ProductCard (image overlay) and ProductDetail (next
 * to Add to cart). Reads/writes WishlistContext directly so every instance
 * for the same product stays in sync without prop drilling. Stops event
 * propagation since ProductCard renders this inside a <Link> - without it,
 * tapping the heart would also navigate to the product page.
 */
export function WishlistButton({ productId, productName, size = "sm", className }: WishlistButtonProps) {
  const { isWishlisted, toggleWishlist } = useWishlist();
  const active = isWishlisted(productId);
  const dimensions = size === "sm" ? "h-8 w-8" : "h-11 w-11";

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleWishlist(productId);
      }}
      aria-pressed={active}
      aria-label={active ? `Remove ${productName} from wishlist` : `Add ${productName} to wishlist`}
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full shadow-soft transition-colors",
        active ? "bg-bloom text-surface hover:bg-bloom-deep" : "bg-surface text-ink-soft hover:text-bloom",
        dimensions,
        className,
      )}
    >
      <Heart size={size === "sm" ? 16 : 20} className={cn(active && "fill-current")} />
    </button>
  );
}
