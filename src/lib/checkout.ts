import type { CartLine } from "@/context/CartContext";
import type { CheckoutFormData, Order, OrderLine, PaymentMethod } from "@/types/order";

export const SHIPPING_FEE = 80;
export const FREE_SHIPPING_THRESHOLD = 1500;

export const PAYMENT_METHODS: { value: PaymentMethod; label: string; description: string }[] = [
  { value: "cod", label: "Cash on Delivery", description: "Pay in cash when your order arrives." },
  { value: "gcash", label: "GCash / Bank Transfer", description: "Pay ahead via GCash or bank transfer." },
];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type CheckoutErrors = Partial<Record<keyof CheckoutFormData, string>>;

/** Validates the checkout form client-side - required fields, plus a light email format check. */
export function validateCheckout(data: CheckoutFormData): CheckoutErrors {
  const errors: CheckoutErrors = {};
  if (!data.fullName.trim()) errors.fullName = "Please enter your full name.";
  if (!EMAIL_PATTERN.test(data.email)) errors.email = "Please enter a valid email address.";
  if (!data.phone.trim()) errors.phone = "Please enter a contact number.";
  if (!data.address.trim()) errors.address = "Please enter your street address.";
  if (!data.city.trim()) errors.city = "Please enter your city.";
  if (!data.province.trim()) errors.province = "Please enter your province.";
  if (!data.zip.trim()) errors.zip = "Please enter your ZIP code.";
  return errors;
}

/**
 * Order numbers are still generated client-side rather than by the
 * database - `orders.order_number` is a plain text primary key (see
 * `supabase/schema.sql`), not a server-assigned identity/sequence, so
 * there's nothing on the backend side to wait on for this value.
 */
function generateOrderNumber(): string {
  const rand = Math.floor(100000 + Math.random() * 900000);
  return `CV-${rand}`;
}

/**
 * Builds the `Order` object Checkout submits - synchronous, since it's
 * pure data construction with no network involved (that part is now
 * `lib/api/orders.ts`'s `apiSaveOrderForUser()`, called separately by
 * Checkout once this has run). Phase 28: this replaces the old
 * `placeOrder()`, which wrapped the exact same construction in a fake
 * `setTimeout`-based Promise to simulate network latency - real latency
 * now comes from the real API call for signed-in checkouts, so faking it
 * here would just double it up. Shipping fee/threshold logic lives here
 * so Cart, Checkout, and the confirmation page can't drift out of sync
 * on the number shown.
 */
export function buildOrder(shipping: CheckoutFormData, lines: CartLine[], subtotal: number): Order {
  const orderLines: OrderLine[] = lines.map((line) => ({
    productId: line.productId,
    name: line.product.name,
    price: line.product.price,
    quantity: line.quantity,
  }));
  const shippingFee = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;

  return {
    orderNumber: generateOrderNumber(),
    placedAt: new Date().toISOString(),
    lines: orderLines,
    subtotal,
    shippingFee,
    total: subtotal + shippingFee,
    shipping,
  };
}
