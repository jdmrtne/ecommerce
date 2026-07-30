import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { CircleCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Squiggle } from "@/components/ui/Squiggle";
import { formatPHP } from "@/lib/currency";
import type { Order } from "@/types/order";
import { PAGE_META } from "@/config/site";
import { useSiteMeta } from "@/hooks/useSiteMeta";

/**
 * Shown right after Checkout places an order. Order data arrives via
 * router location state (set by Checkout's navigate call) rather than
 * global state or a URL param, since it's a one-time receipt, not
 * something that needs to survive a refresh or be linkable/bookmarkable.
 * A direct visit with no state (e.g. a refresh, or typing the URL) redirects
 * to the shop rather than rendering a broken/empty receipt.
 *
 * Phase 28: for a signed-in checkout, the order shown here is the exact
 * object that was just written to the real `orders` table via
 * `apiSaveOrderForUser()` - Checkout only navigates here after that write
 * succeeds. This page itself still doesn't re-fetch it from the backend
 * (see above for why a receipt is intentionally not refresh-durable); a
 * signed-in shopper can look the same order up again afterward on
 * `/account`, which does read live from the backend.
 */
export function OrderConfirmation() {
  useSiteMeta(PAGE_META.orderConfirmation);

  const location = useLocation();
  const navigate = useNavigate();
  const order = (location.state as { order?: Order } | null)?.order;

  useEffect(() => {
    if (!order) {
      navigate("/shop", { replace: true });
    }
  }, [order, navigate]);

  if (!order) return null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6 lg:px-8">
      <CircleCheck size={48} className="mx-auto text-success" />
      <h1 className="mt-4 font-display text-3xl text-ink sm:text-4xl">Thank you for your order!</h1>
      <Squiggle className="mx-auto my-4" />
      <p className="text-ink-soft">
        Your order <span className="font-semibold text-ink">{order.orderNumber}</span> has been
        placed. A confirmation has been sent to{" "}
        <span className="font-semibold text-ink">{order.shipping.email}</span>.
      </p>

      <div className="mt-8 rounded-lg border border-beige bg-surface p-6 text-left shadow-soft">
        <ul className="flex flex-col gap-2">
          {order.lines.map((line) => (
            <li key={line.productId} className="flex justify-between gap-3 text-sm text-ink-soft">
              <span className="line-clamp-1">
                {line.name} &times; {line.quantity}
              </span>
              <span className="shrink-0 text-ink">{formatPHP(line.price * line.quantity)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex flex-col gap-2 border-t border-beige pt-4 text-sm">
          <div className="flex items-center justify-between text-ink-soft">
            <span>Subtotal</span>
            <span className="font-medium text-ink">{formatPHP(order.subtotal)}</span>
          </div>
          <div className="flex items-center justify-between text-ink-soft">
            <span>Shipping{order.shipping.shippingMethodName ? ` (${order.shipping.shippingMethodName})` : ""}</span>
            <span className="font-medium text-ink">
              {order.shippingFee === 0 ? "Free" : formatPHP(order.shippingFee)}
            </span>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-beige pt-3">
          <span className="font-semibold text-ink">Total</span>
          <span className="font-display text-xl text-denim-deep">{formatPHP(order.total)}</span>
        </div>
        <div className="mt-4 border-t border-beige pt-4 text-sm text-ink-soft">
          <p className="font-semibold text-ink">Shipping to</p>
          <p>{order.shipping.fullName}</p>
          <p>
            {order.shipping.address}, {order.shipping.city}, {order.shipping.province}{" "}
            {order.shipping.zip}
          </p>
        </div>
      </div>

      <Button size="lg" className="mt-8" onClick={() => navigate("/shop")}>
        Continue shopping
      </Button>
    </div>
  );
}
