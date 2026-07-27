import { Link, useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { QuantityStepper } from "@/components/ui/QuantityStepper";
import { CraftIcon } from "@/components/ui/CraftIcon";
import { EmptyState } from "@/components/ui/StateMessage";
import { formatPHP } from "@/lib/currency";
import { useCart } from "@/context/CartContext";
import { EMPTY_STATES } from "@/content/states";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Lightweight cart summary opened from the Navbar's cart icon. Lets people
 * review what's in the cart, adjust quantities, or remove items. The
 * primary action hands off to the full /cart page (which then leads to
 * /checkout) rather than checking out from inside the drawer itself - a
 * modal is the wrong place for a multi-field shipping form.
 */
export function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const { lines, subtotal, updateQuantity, removeItem } = useCart();
  const navigate = useNavigate();

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Your cart" size="md">
      {lines.length === 0 ? (
        <EmptyState {...EMPTY_STATES.cart} onAction={onClose} />
      ) : (
        <div className="flex flex-col gap-4">
          <ul className="flex max-h-[50vh] flex-col divide-y divide-beige overflow-y-auto">
            {lines.map((line) => (
              <li key={line.productId} className="flex items-start gap-3 py-4 first:pt-0">
                <CraftIcon
                  category={line.product.category}
                  className="h-14 w-14 shrink-0"
                  iconClassName="h-6 w-6"
                />
                <div className="min-w-0 flex-1">
                  <Link
                    to={`/shop/${line.productId}`}
                    onClick={onClose}
                    className="line-clamp-1 font-semibold text-ink hover:text-denim"
                  >
                    {line.product.name}
                  </Link>
                  <p className="text-sm text-ink-soft">{formatPHP(line.product.price)}</p>
                  <div className="mt-2 flex items-center gap-3">
                    <QuantityStepper
                      size="sm"
                      value={line.quantity}
                      onChange={(q) => updateQuantity(line.productId, q)}
                      label={`quantity of ${line.product.name}`}
                    />
                    <button
                      type="button"
                      onClick={() => removeItem(line.productId)}
                      aria-label={`Remove ${line.product.name} from cart`}
                      className="text-ink-soft transition-colors hover:text-error"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
                <p className="shrink-0 font-display text-denim-deep">
                  {formatPHP(line.product.price * line.quantity)}
                </p>
              </li>
            ))}
          </ul>

          <div className="flex items-center justify-between border-t border-beige pt-4">
            <span className="font-semibold text-ink">Subtotal</span>
            <span className="font-display text-xl text-denim-deep">{formatPHP(subtotal)}</span>
          </div>
          <Button
            className="w-full"
            onClick={() => {
              onClose();
              navigate("/cart");
            }}
          >
            View cart &amp; checkout
          </Button>
          <button
            type="button"
            onClick={onClose}
            className="text-center text-sm font-medium text-ink-soft transition-colors hover:text-denim"
          >
            Continue shopping
          </button>
        </div>
      )}
    </Modal>
  );
}
