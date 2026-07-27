import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { formatPHP } from "@/lib/currency";
import { cn } from "@/lib/cn";
import {
  FREE_SHIPPING_THRESHOLD,
  PAYMENT_METHODS,
  SHIPPING_FEE,
  placeOrder,
  validateCheckout,
} from "@/lib/checkout";
import type { CheckoutErrors } from "@/lib/checkout";
import { saveOrderForUser } from "@/lib/orders";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import type { CheckoutFormData } from "@/types/order";
import { PAGE_META } from "@/config/site";
import { useSiteMeta } from "@/hooks/useSiteMeta";

const BLANK_FORM: Omit<CheckoutFormData, "fullName" | "email"> = {
  phone: "",
  address: "",
  city: "",
  province: "",
  zip: "",
  paymentMethod: "cod",
  notes: "",
};

/**
 * Shipping details + payment method, then a simulated order placement
 * (same fake-latency pattern as Newsletter's subscribe()). Redirects to
 * /cart if there's nothing to check out.
 *
 * If someone's logged in, their name/email are pre-filled (one less thing
 * to type) and the placed order is saved to their account's order history
 * via saveOrderForUser() - guest checkout still works identically, the
 * order just isn't saved anywhere to look up again afterward.
 *
 * `placedOrder` guards the empty-cart redirect against a race with the
 * post-submit navigate to /order-confirmation: clearCart() empties `lines`
 * a render before the navigate actually takes effect, and without the
 * guard that render would otherwise bounce the user to /cart instead.
 */
export function Checkout() {
  useSiteMeta(PAGE_META.checkout);

  const { lines, subtotal, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState<CheckoutFormData>(() => ({
    ...BLANK_FORM,
    fullName: user?.name ?? "",
    email: user?.email ?? "",
  }));
  const [errors, setErrors] = useState<CheckoutErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [placedOrder, setPlacedOrder] = useState(false);

  useEffect(() => {
    if (lines.length === 0 && !placedOrder) {
      navigate("/cart", { replace: true });
    }
  }, [lines.length, placedOrder, navigate]);

  function updateField<K extends keyof CheckoutFormData>(key: K, value: CheckoutFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const validationErrors = validateCheckout(form);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setIsSubmitting(true);
    const order = await placeOrder(form, lines, subtotal);
    setPlacedOrder(true);
    if (user) {
      saveOrderForUser(user.email, order);
    }
    clearCart();
    navigate("/order-confirmation", { state: { order } });
  }

  if (lines.length === 0) return null; // redirect effect above handles navigation

  const shippingFee = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
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
              <span>Shipping</span>
              <span className="font-medium text-ink">
                {shippingFee === 0 ? "Free" : formatPHP(shippingFee)}
              </span>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-beige pt-3">
            <span className="font-semibold text-ink">Total</span>
            <span className="font-display text-xl text-denim-deep">{formatPHP(total)}</span>
          </div>
          <Button type="submit" size="lg" isLoading={isSubmitting} className="mt-6 w-full">
            Place order
          </Button>
        </div>
      </form>
    </div>
  );
}
