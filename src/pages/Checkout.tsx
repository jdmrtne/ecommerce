import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { formatPHP } from "@/lib/currency";
import { cn } from "@/lib/cn";
import { PAYMENT_METHODS, buildOrder, pesosToCentavos, validateCard, validateCheckout } from "@/lib/checkout";
import type { CardErrors, CheckoutErrors } from "@/lib/checkout";
import { apiSaveOrderForUser } from "@/lib/api/orders";
import { apiGetProducts } from "@/lib/api/products";
import { checkStockForLines } from "@/lib/inventory";
import type { StockIssue } from "@/lib/inventory";
import {
  attachPaymentMethod,
  createPaymentIntent,
  createPaymentMethod,
  redirectToPaymentAuth,
} from "@/lib/payments/paymongo";
import { clearPendingCardCheckout, savePendingCardCheckout } from "@/lib/payments/pendingCheckout";
import { computeShippingFee, filterMethodsForProvince } from "@/lib/shippingSettingsStore";
import { useShippingSettings } from "@/hooks/useShippingSettings";
import type { ShippingMethod } from "@/types/shipping";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import type { CheckoutFormData, Order } from "@/types/order";
import type { CardDetails } from "@/types/payment";
import { PAGE_META } from "@/config/site";
import { useSiteMeta } from "@/hooks/useSiteMeta";

const BLANK_FORM: Omit<CheckoutFormData, "fullName" | "email" | "shippingMethodId" | "shippingMethodName"> = {
  phone: "",
  address: "",
  city: "",
  province: "",
  zip: "",
  paymentMethod: "cod",
  notes: "",
};

const BLANK_CARD_FORM = { number: "", name: "", expMonth: "", expYear: "", cvc: "" };

/**
 * Shipping details + payment method, then a real order placement.
 * Redirects to /cart if there's nothing to check out.
 *
 * If someone's logged in, their name/email are pre-filled (one less thing
 * to type) and the placed order is written to the real `orders` table via
 * `apiSaveOrderForUser()` (Phase 28), visible afterward in Account's order
 * history. Guest checkout still works identically to before, but the
 * order still isn't persisted anywhere to look up again afterward - the
 * `orders` table's RLS policy (`supabase/schema.sql`) only allows a
 * signed-in user to insert a row for their own email, so there's nowhere
 * for an unauthenticated write to go. This is the same guest limitation
 * `saveOrderForUser()` had before this phase (see `MASTER_HANDOFF.md`
 * Known Issues), just now enforced by the database instead of by this
 * component choosing not to call a `localStorage` write.
 *
 * A failed write (network error, RLS rejection, etc.) shows an inline
 * error and leaves the cart and form intact so the shopper can retry -
 * it does not clear the cart or navigate to the confirmation page, since
 * nothing was actually saved.
 *
 * Phase 29 - Inventory. Right before that write, `handleSubmit` re-fetches
 * the live catalog and runs `checkStockForLines()` against it - a last
 * check in case stock changed since the cart page was loaded (another
 * shopper bought the last unit, an admin edited it, etc.). If anything
 * fails that check the submit stops there with an itemized inline error
 * and no order is built or saved; the actual atomic guarantee against a
 * concurrent race is the `orders_decrement_stock` trigger in
 * `supabase/schema.sql`, this is just the friendly version of the same
 * rule shown before the write is attempted.
 *
 * `placedOrder` guards the empty-cart redirect against a race with the
 * post-submit navigate to /order-confirmation: clearCart() empties `lines`
 * a render before the navigate actually takes effect, and without the
 * guard that render would otherwise bounce the user to /cart instead.
 *
 * Phase 31 - Payments. "cod"/"gcash" still take the original path above
 * unchanged (order built and saved immediately - see `lib/checkout.ts`'s
 * doc comment on `PAYMENT_METHODS` for why neither needs a gateway call).
 * "card" instead runs `processCardPayment()`: tokenize the card with
 * PayMongo (public key, direct from the browser), create a Payment
 * Intent and attach that Payment Method to it (both via this app's own
 * `/api/paymongo/*` functions - see `lib/payments/paymongo.ts`), and
 * only build/save the order once the intent actually reports
 * `succeeded`. A card that needs 3D Secure sends the shopper's whole tab
 * to PayMongo and back - the order built just before that redirect is
 * stashed in `sessionStorage` first (`lib/payments/pendingCheckout.ts`),
 * since in-memory state like this component's own `form` won't survive
 * the round trip; `CheckoutPaymentReturn.tsx` is where that trip ends.
 *
 * Phase 32 - Shipping. The flat `SHIPPING_FEE`/`FREE_SHIPPING_THRESHOLD`
 * constants are gone - shipping cost now comes from an admin-configurable
 * list of `ShippingMethod`s (`lib/shippingSettingsStore.ts`), filtered to
 * whichever are available for the shopper's entered province
 * (`filterMethodsForProvince`) and shown as a radio choice, same shape as
 * the payment method picker. `availableShippingMethods` re-derives
 * whenever the province field or the admin's saved methods change; an
 * effect keeps `form.shippingMethodId`/`shippingMethodName` pointed at a
 * still-available method any time the previous selection falls out of
 * that filtered list (e.g. the shopper edits their province to one a
 * zone-restricted method doesn't cover). The selected method's id/name
 * are snapshotted onto the built `Order` the same way a product's name is
 * snapshotted onto each `OrderLine` - so a later admin rename/removal
 * doesn't change what an already-placed order's receipt shows.
 */
export function Checkout() {
  useSiteMeta(PAGE_META.checkout);

  const { lines, subtotal, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { methods: shippingMethods } = useShippingSettings();

  const [form, setForm] = useState<CheckoutFormData>(() => {
    const initialMethod = filterMethodsForProvince(shippingMethods, "")[0];
    return {
      ...BLANK_FORM,
      fullName: user?.name ?? "",
      email: user?.email ?? "",
      shippingMethodId: initialMethod?.id ?? "",
      shippingMethodName: initialMethod?.name ?? "",
    };
  });
  const [errors, setErrors] = useState<CheckoutErrors>({});
  const [cardForm, setCardForm] = useState(BLANK_CARD_FORM);
  const [cardErrors, setCardErrors] = useState<CardErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [placedOrder, setPlacedOrder] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [stockIssues, setStockIssues] = useState<StockIssue[]>([]);
  const [cardSaveFailedOrderNumber, setCardSaveFailedOrderNumber] = useState<string | null>(null);

  useEffect(() => {
    if (lines.length === 0 && !placedOrder) {
      navigate("/cart", { replace: true });
    }
  }, [lines.length, placedOrder, navigate]);

  const availableShippingMethods = useMemo(
    () => filterMethodsForProvince(shippingMethods, form.province),
    [shippingMethods, form.province],
  );

  // Keeps the selection pointed at a still-available method whenever the
  // filtered list changes out from under it (province edited to one a
  // zone-restricted method doesn't cover, or an admin edit removes/renames
  // the previously-selected method).
  useEffect(() => {
    if (availableShippingMethods.length === 0) return;
    const stillAvailable = availableShippingMethods.some((method) => method.id === form.shippingMethodId);
    if (stillAvailable) return;
    const next = availableShippingMethods[0];
    setForm((prev) => ({ ...prev, shippingMethodId: next.id, shippingMethodName: next.name }));
  }, [availableShippingMethods, form.shippingMethodId]);

  const selectedShippingMethod =
    availableShippingMethods.find((method) => method.id === form.shippingMethodId) ?? availableShippingMethods[0];

  function updateField<K extends keyof CheckoutFormData>(key: K, value: CheckoutFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function updateCardField<K extends keyof typeof BLANK_CARD_FORM>(key: K, value: (typeof BLANK_CARD_FORM)[K]) {
    setCardForm((prev) => ({ ...prev, [key]: value }));
  }

  function selectShippingMethod(method: ShippingMethod) {
    setForm((prev) => ({ ...prev, shippingMethodId: method.id, shippingMethodName: method.name }));
  }

  function cardDetails(): CardDetails {
    return {
      number: cardForm.number,
      name: cardForm.name,
      expMonth: Number(cardForm.expMonth),
      expYear: Number(cardForm.expYear),
      cvc: cardForm.cvc,
    };
  }

  /**
   * Runs the PayMongo card flow for an already-built `order`. Either
   * finishes the checkout the same way the cod/gcash path does
   * (save-if-signed-in, clear cart, navigate to confirmation), hands off
   * to a 3D Secure redirect (leaves `isSubmitting` true - the page is
   * about to navigate away for real), or throws so the caller's existing
   * `catch` shows an inline error, same as any other submit failure.
   */
  async function processCardPayment(order: Order) {
    const paymentMethodId = await createPaymentMethod(cardDetails());
    const intent = await createPaymentIntent(pesosToCentavos(order.total), `Order ${order.orderNumber}`);
    savePendingCardCheckout(intent.id, { order, userEmail: user?.email ?? null });

    const returnUrl = `${window.location.origin}/checkout/payment-return?intent_id=${intent.id}`;
    const attachResult = await attachPaymentMethod(intent.id, paymentMethodId, returnUrl);

    if (attachResult.status === "awaiting_next_action" && attachResult.nextActionUrl) {
      redirectToPaymentAuth(attachResult.nextActionUrl);
      return;
    }

    if (attachResult.status !== "succeeded") {
      clearPendingCardCheckout(intent.id);
      throw new Error("Your card could not be charged. Please check your details or try a different card.");
    }

    clearPendingCardCheckout(intent.id);
    if (user) {
      try {
        await apiSaveOrderForUser(user.email, order);
      } catch {
        // The charge already succeeded - showing a normal retryable error
        // here would risk a second charge for the same order, so this
        // gets its own dead-end state instead (see the render below).
        setCardSaveFailedOrderNumber(order.orderNumber);
        setIsSubmitting(false);
        return;
      }
    }
    setPlacedOrder(true);
    clearCart();
    navigate("/order-confirmation", { state: { order } });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const validationErrors = validateCheckout(form);
    setErrors(validationErrors);

    const cardValidationErrors = form.paymentMethod === "card" ? validateCard(cardDetails()) : {};
    setCardErrors(cardValidationErrors);

    if (Object.keys(validationErrors).length > 0 || Object.keys(cardValidationErrors).length > 0) return;

    if (!selectedShippingMethod) {
      setSubmitError("No shipping method is available for the selected province. Please update your address.");
      return;
    }

    setSubmitError(null);
    setStockIssues([]);
    setIsSubmitting(true);
    try {
      const liveProducts = await apiGetProducts();
      const issues = checkStockForLines(liveProducts, lines);
      if (issues.length > 0) {
        setStockIssues(issues);
        setIsSubmitting(false);
        return;
      }

      const shippingFee = computeShippingFee(selectedShippingMethod, subtotal);
      const order = buildOrder(
        { ...form, shippingMethodId: selectedShippingMethod.id, shippingMethodName: selectedShippingMethod.name },
        lines,
        subtotal,
        shippingFee,
      );

      if (form.paymentMethod === "card") {
        await processCardPayment(order);
        return;
      }

      if (user) {
        await apiSaveOrderForUser(user.email, order);
      }
      setPlacedOrder(true);
      clearCart();
      navigate("/order-confirmation", { state: { order } });
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Something went wrong placing your order.");
      setIsSubmitting(false);
    }
  }

  if (cardSaveFailedOrderNumber) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-20 text-center sm:px-6 lg:px-8">
        <SectionHeading eyebrow="Payment" title="We hit a snag" align="center" />
        <p role="alert" className="mt-6 text-error">
          Your payment for order {cardSaveFailedOrderNumber} was successful, but we ran into a problem recording
          your order. Please contact us with this order number and we&apos;ll sort it out right away.
        </p>
      </div>
    );
  }

  if (lines.length === 0) return null; // redirect effect above handles navigation

  const shippingFee = selectedShippingMethod ? computeShippingFee(selectedShippingMethod, subtotal) : 0;
  const total = subtotal + shippingFee;

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <SectionHeading eyebrow="Almost there" title="Checkout" align="left" />

      <form onSubmit={handleSubmit} noValidate className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-3">
        <div className="flex flex-col gap-8 lg:col-span-2">
          <fieldset className="flex flex-col gap-4">
            <legend className="mb-1 font-display text-xl text-ink">Contact</legend>
            <Input
              label="Full name"
              value={form.fullName}
              onChange={(e) => updateField("fullName", e.target.value)}
              error={errors.fullName}
              disabled={isSubmitting}
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                type="email"
                label="Email"
                value={form.email}
                onChange={(e) => updateField("email", e.target.value)}
                error={errors.email}
                disabled={isSubmitting}
              />
              <Input
                type="tel"
                label="Phone number"
                value={form.phone}
                onChange={(e) => updateField("phone", e.target.value)}
                error={errors.phone}
                disabled={isSubmitting}
              />
            </div>
          </fieldset>

          <fieldset className="flex flex-col gap-4">
            <legend className="mb-1 font-display text-xl text-ink">Shipping address</legend>
            <Input
              label="Street address"
              value={form.address}
              onChange={(e) => updateField("address", e.target.value)}
              error={errors.address}
              disabled={isSubmitting}
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Input
                label="City"
                value={form.city}
                onChange={(e) => updateField("city", e.target.value)}
                error={errors.city}
                disabled={isSubmitting}
              />
              <Input
                label="Province"
                value={form.province}
                onChange={(e) => updateField("province", e.target.value)}
                error={errors.province}
                disabled={isSubmitting}
              />
              <Input
                label="ZIP code"
                value={form.zip}
                onChange={(e) => updateField("zip", e.target.value)}
                error={errors.zip}
                disabled={isSubmitting}
              />
            </div>
            <Textarea
              label="Delivery notes (optional)"
              placeholder="Landmark, gate code, preferred delivery time..."
              value={form.notes}
              onChange={(e) => updateField("notes", e.target.value)}
              disabled={isSubmitting}
            />
          </fieldset>

          <fieldset className="flex flex-col gap-3">
            <legend className="mb-1 font-display text-xl text-ink">Shipping method</legend>
            {availableShippingMethods.length === 0 ? (
              <p role="alert" className="text-sm text-error">
                No shipping method is available for this province yet. Please double-check the province above.
              </p>
            ) : (
              availableShippingMethods.map((method) => {
                const fee = computeShippingFee(method, subtotal);
                return (
                  <label
                    key={method.id}
                    className={cn(
                      "flex cursor-pointer items-start gap-3 rounded-md border-2 p-4 transition-colors",
                      form.shippingMethodId === method.id
                        ? "border-denim bg-denim-tint/40"
                        : "border-beige hover:border-beige-dark",
                    )}
                  >
                    <input
                      type="radio"
                      name="shippingMethod"
                      value={method.id}
                      checked={form.shippingMethodId === method.id}
                      onChange={() => selectShippingMethod(method)}
                      className="mt-1 accent-denim"
                      disabled={isSubmitting}
                    />
                    <span className="flex flex-1 items-start justify-between gap-3">
                      <span>
                        <span className="block font-semibold text-ink">{method.name}</span>
                        {method.description && (
                          <span className="block text-sm text-ink-soft">{method.description}</span>
                        )}
                      </span>
                      <span className="shrink-0 font-medium text-ink">{fee === 0 ? "Free" : formatPHP(fee)}</span>
                    </span>
                  </label>
                );
              })
            )}
          </fieldset>

          <fieldset className="flex flex-col gap-3">
            <legend className="mb-1 font-display text-xl text-ink">Payment</legend>
            {PAYMENT_METHODS.map((method) => (
              <label
                key={method.value}
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-md border-2 p-4 transition-colors",
                  form.paymentMethod === method.value
                    ? "border-denim bg-denim-tint/40"
                    : "border-beige hover:border-beige-dark",
                )}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value={method.value}
                  checked={form.paymentMethod === method.value}
                  onChange={() => updateField("paymentMethod", method.value)}
                  className="mt-1 accent-denim"
                  disabled={isSubmitting}
                />
                <span>
                  <span className="block font-semibold text-ink">{method.label}</span>
                  <span className="block text-sm text-ink-soft">{method.description}</span>
                </span>
              </label>
            ))}
            {form.paymentMethod === "card" && (
              <div className="mt-2 flex flex-col gap-4 rounded-md border-2 border-beige p-4">
                <Input
                  label="Card number"
                  inputMode="numeric"
                  autoComplete="cc-number"
                  placeholder="4343 4343 4343 4345"
                  value={cardForm.number}
                  onChange={(e) => updateCardField("number", e.target.value)}
                  error={cardErrors.number}
                  disabled={isSubmitting}
                />
                <Input
                  label="Name on card"
                  autoComplete="cc-name"
                  value={cardForm.name}
                  onChange={(e) => updateCardField("name", e.target.value)}
                  error={cardErrors.name}
                  disabled={isSubmitting}
                />
                <div className="grid grid-cols-3 gap-4">
                  <Input
                    label="Exp. month"
                    inputMode="numeric"
                    autoComplete="cc-exp-month"
                    placeholder="MM"
                    value={cardForm.expMonth}
                    onChange={(e) => updateCardField("expMonth", e.target.value)}
                    error={cardErrors.expMonth}
                    disabled={isSubmitting}
                  />
                  <Input
                    label="Exp. year"
                    inputMode="numeric"
                    autoComplete="cc-exp-year"
                    placeholder="YYYY"
                    value={cardForm.expYear}
                    onChange={(e) => updateCardField("expYear", e.target.value)}
                    error={cardErrors.expYear}
                    disabled={isSubmitting}
                  />
                  <Input
                    label="CVC"
                    inputMode="numeric"
                    autoComplete="cc-csc"
                    placeholder="123"
                    value={cardForm.cvc}
                    onChange={(e) => updateCardField("cvc", e.target.value)}
                    error={cardErrors.cvc}
                    disabled={isSubmitting}
                  />
                </div>
                <p className="text-xs text-ink-soft">
                  Payments are processed securely by PayMongo. Your card details are sent directly to PayMongo and
                  never touch our servers.
                </p>
              </div>
            )}
          </fieldset>
        </div>

        <div className="h-fit rounded-lg border border-beige bg-surface p-6 shadow-soft">
          <h2 className="font-display text-xl text-ink">Order summary</h2>
          <ul className="mt-4 flex flex-col gap-2">
            {lines.map((line) => (
              <li key={line.productId} className="flex justify-between gap-3 text-sm text-ink-soft">
                <span className="line-clamp-1">
                  {line.product.name} &times; {line.quantity}
                </span>
                <span className="shrink-0 text-ink">{formatPHP(line.product.price * line.quantity)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex flex-col gap-2 border-t border-beige pt-4 text-sm">
            <div className="flex items-center justify-between text-ink-soft">
              <span>Subtotal</span>
              <span className="font-medium text-ink">{formatPHP(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between text-ink-soft">
              <span>Shipping{selectedShippingMethod ? ` (${selectedShippingMethod.name})` : ""}</span>
              <span className="font-medium text-ink">
                {shippingFee === 0 ? "Free" : formatPHP(shippingFee)}
              </span>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-beige pt-3">
            <span className="font-semibold text-ink">Total</span>
            <span className="font-display text-xl text-denim-deep">{formatPHP(total)}</span>
          </div>
          {stockIssues.length > 0 && (
            <div role="alert" className="mt-4 rounded-md border-2 border-error/40 bg-error/5 p-4 text-sm text-error">
              <p className="font-semibold">Some items are no longer available in the quantity you selected:</p>
              <ul className="mt-2 list-disc pl-5">
                {stockIssues.map((issue) => (
                  <li key={issue.productId}>
                    {issue.name} &mdash; {issue.available > 0 ? `only ${issue.available} left` : "out of stock"} (you
                    have {issue.requested} in your cart)
                  </li>
                ))}
              </ul>
              <Link to="/cart" className="mt-2 inline-block font-semibold underline">
                Update your cart
              </Link>
            </div>
          )}
          {submitError && <p className="mt-4 text-sm text-error">{submitError}</p>}
          <Button
            type="submit"
            size="lg"
            isLoading={isSubmitting}
            disabled={!selectedShippingMethod}
            className="mt-6 w-full"
          >
            Place order
          </Button>
        </div>
      </form>
    </div>
  );
}
