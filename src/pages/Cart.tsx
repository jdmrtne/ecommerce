import { Link, useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { QuantityStepper } from "@/components/ui/QuantityStepper";
import { CraftIcon } from "@/components/ui/CraftIcon";
import { EmptyState } from "@/components/ui/StateMessage";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { formatPHP } from "@/lib/currency";
import { useCart } from "@/context/CartContext";
import { EMPTY_STATES } from "@/content/states";
import { PAGE_META } from "@/config/site";
import { useSiteMeta } from "@/hooks/useSiteMeta";

/**
 * Full-page cart review - the roomier counterpart to the Navbar's
 * CartDrawer (which stays as a quick-glance summary). This is where
 * "Proceed to checkout" lives, since checkout needs its own dedicated
 * route (Checkout.tsx) rather than living inside a modal.
 */
export function Cart() {
  useSiteMeta(PAGE_META.cart);
  const { lines, subtotal, updateQuantity, removeItem } = useCart();
  const navigate = useNavigate();

  if (lines.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <EmptyState {...EMPTY_STATES.cart} onAction={() => navigate("/shop")} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <SectionHeading eyebrow="Review" title="Your Cart" align="left" />

      <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-3">
        <ul className="flex flex-col divide-y divide-beige lg:col-span-2">
          {lines.map((line) => (
            <li key={line.productId} className="flex items-start gap-4 py-6 first:pt-0">
              <CraftIcon
                category={line.product.category}
                className="h-20 w-20 shrink-0"
                iconClassName="h-8 w-8"
              />
              <div className="min-w-0 flex-1">
                <Link to={`/shop/${line.productId}`} className="font-semibold text-ink hover:text-denim">
                  {line.product.name}
                </Link>
                <p className="mt-1 text-sm text-ink-soft">{formatPHP(line.product.price)} each</p>
                <div className="mt-3 flex flex-wrap items-center gap-4">
                  <QuantityStepper
                    value={line.quantity}
                    onChange={(q) => updateQuantity(line.productId, q)}
                    label={`quantity of ${line.product.name}`}
                  />
                  <button
                    type="button"
                    onClick={() => removeItem(line.productId)}
                    aria-label={`Remove ${line.product.name} from cart`}
                    className="flex items-center gap-1 text-sm text-ink-soft transition-colors hover:text-error"
                  >
                    <X size={14} />
                    Remove
                  </button>
                </div>
              </div>
              <p className="shrink-0 font-display text-lg text-denim-deep">
                {formatPHP(line.product.price * line.quantity)}
              </p>
            </li>
          ))}
        </ul>

        <div className="h-fit rounded-lg border border-beige bg-surface p-6 shadow-soft">
          <h2 className="font-display text-xl text-ink">Order summary</h2>
          <div className="mt-4 flex items-center justify-between text-sm text-ink-soft">
            <span>Subtotal</span>
            <span className="font-medium text-ink">{formatPHP(subtotal)}</span>
          </div>
          <p className="mt-1 text-xs text-ink-soft">Shipping calculated at checkout.</p>
          <Button size="lg" className="mt-6 w-full" onClick={() => navigate("/checkout")}>
            Proceed to checkout
          </Button>
          <Link
            to="/shop"
            className="mt-3 block text-center text-sm font-medium text-ink-soft hover:text-denim"
          >
            Continue shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
