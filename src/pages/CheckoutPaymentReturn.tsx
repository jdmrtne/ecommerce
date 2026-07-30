import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { retrievePaymentIntent } from "@/lib/payments/paymongo";
import { clearPendingCardCheckout, loadPendingCardCheckout } from "@/lib/payments/pendingCheckout";
import { apiSaveOrderForUser } from "@/lib/api/orders";
import { useCart } from "@/context/CartContext";
import { PAGE_META } from "@/config/site";
import { useSiteMeta } from "@/hooks/useSiteMeta";

const POLL_ATTEMPTS = 5;
const POLL_DELAY_MS = 1500;

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

type ViewState =
  | { kind: "checking" }
  | { kind: "error"; message: string }
  | { kind: "saved-but-unconfirmed"; orderNumber: string };

/**
 * Phase 31 - Payments. Where a card checkout that required 3D Secure
 * lands after PayMongo redirects the shopper back (see
 * `redirectToPaymentAuth()` / `attachPaymentMethod()`'s `returnUrl` in
 * `Checkout.tsx`). This is a full-page navigation, not an SPA route
 * change, so the order that was already built before the redirect was
 * stashed in `sessionStorage` (`lib/payments/pendingCheckout.ts`) rather
 * than passed as router state - it wouldn't have survived otherwise.
 *
 * Polls `retrievePaymentIntent()` a few times rather than trusting the
 * redirect alone, since PayMongo's own docs note the intent can briefly
 * sit in `processing` right after authentication completes.
 */
export function CheckoutPaymentReturn() {
  useSiteMeta(PAGE_META.checkoutPaymentReturn);

  const [searchParams] = useSearchParams();
  const intentId = searchParams.get("intent_id");
  const { clearCart } = useCart();
  const navigate = useNavigate();
  const [view, setView] = useState<ViewState>({ kind: "checking" });
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    if (!intentId) {
      setView({ kind: "error", message: "We couldn't find your payment details. If you were charged, please contact us with your bank statement reference." });
      return;
    }

    const pending = loadPendingCardCheckout(intentId);
    if (!pending) {
      setView({ kind: "error", message: "We couldn't find your order details for this payment. If you were charged, please contact us with your bank statement reference." });
      return;
    }

    (async () => {
      let status = await retrievePaymentIntent(intentId);
      let attempts = 1;
      while (status === "processing" && attempts < POLL_ATTEMPTS) {
        await wait(POLL_DELAY_MS);
        status = await retrievePaymentIntent(intentId);
        attempts += 1;
      }

      if (status !== "succeeded") {
        clearPendingCardCheckout(intentId);
        setView({
          kind: "error",
          message: "Your payment wasn't completed, so this order wasn't placed. You haven't been charged. Please try again.",
        });
        return;
      }

      try {
        if (pending.userEmail) {
          await apiSaveOrderForUser(pending.userEmail, pending.order);
        }
        clearPendingCardCheckout(intentId);
        clearCart();
        navigate("/order-confirmation", { state: { order: pending.order }, replace: true });
      } catch {
        // Payment succeeded but recording the order failed - do NOT offer
        // a "try again" path here, that would risk a second charge for
        // an order that was already paid for.
        setView({ kind: "saved-but-unconfirmed", orderNumber: pending.order.orderNumber });
      }
    })().catch(() => {
      setView({
        kind: "error",
        message: "We couldn't confirm your payment status. If you were charged, please contact us with your bank statement reference.",
      });
    });
  }, [intentId, clearCart, navigate]);

  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-20 text-center sm:px-6 lg:px-8">
      <SectionHeading eyebrow="Payment" title="Confirming your payment" align="center" />
      {view.kind === "checking" && (
        <p className="mt-6 text-ink-soft">Please wait while we confirm your card payment with your bank. Don&apos;t close this page.</p>
      )}
      {view.kind === "error" && (
        <div className="mt-6 flex flex-col items-center gap-6">
          <p role="alert" className="text-error">
            {view.message}
          </p>
          <Link to="/checkout">
            <Button>Return to checkout</Button>
          </Link>
        </div>
      )}
      {view.kind === "saved-but-unconfirmed" && (
        <div className="mt-6 flex flex-col items-center gap-6">
          <p role="alert" className="text-error">
            Your payment for order {view.orderNumber} was successful, but we ran into a problem recording your order.
            Please contact us with this order number and we&apos;ll sort it out right away.
          </p>
          <Link to="/">
            <Button>Back to home</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
