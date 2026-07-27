import { useNavigate } from "react-router-dom";
import { ProductCard } from "@/components/ui/ProductCard";
import { EmptyState } from "@/components/ui/StateMessage";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { useWishlist } from "@/context/WishlistContext";
import { EMPTY_STATES } from "@/content/states";
import { PAGE_META } from "@/config/site";
import { useSiteMeta } from "@/hooks/useSiteMeta";

/**
 * Full wishlist page. Reads straight from WishlistContext - unlike Shop or
 * ProductDetail, this data never left the browser (it's just localStorage),
 * so there's no simulated fetch/loading state here.
 */
export function Wishlist() {
  useSiteMeta(PAGE_META.wishlist);
  const { items } = useWishlist();
  const navigate = useNavigate();

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <SectionHeading
        eyebrow="Saved for later"
        title="Your Wishlist"
        description="Pieces you've hearted while browsing. Add them to your cart whenever you're ready."
      />

      <div className="mt-10">
        {items.length === 0 ? (
          <EmptyState {...EMPTY_STATES.wishlist} onAction={() => navigate("/shop")} />
        ) : (
          <>
            <p className="mb-4 text-sm text-ink-soft">
              {items.length} {items.length === 1 ? "piece" : "pieces"} saved
            </p>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 lg:grid-cols-4">
              {items.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
