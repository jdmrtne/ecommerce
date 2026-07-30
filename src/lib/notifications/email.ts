import type { Order } from "@/types/order";

/**
 * Phase 33 - Notifications. Provider: Resend (confirmed with the project
 * owner). This app never talks to Resend directly from the browser -
 * unlike PayMongo's public/secret key split, an email send has no
 * client-safe half at all, so the whole thing goes through this app's
 * own `/api/resend/send-order-confirmation` serverless function, the
 * only place `RESEND_API_KEY` is read (see `api/resend/_shared.ts`).
 *
 * Runs for every checkout, signed-in or guest - an email just needs an
 * address, unlike the in-app notification (`lib/api/notifications.ts`),
 * which needs a signed-in owner row to write to. See
 * `lib/notifications/notify.ts`'s `notifyOrderPlaced()`, the shared call
 * site both `Checkout.tsx` and `CheckoutPaymentReturn.tsx` use, for how
 * a failure here is handled without blocking or failing the checkout
 * that already succeeded.
 */
export async function sendOrderConfirmationEmail(order: Order, businessName: string): Promise<void> {
  const response = await fetch("/api/resend/send-order-confirmation", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      to: order.shipping.email,
      customerName: order.shipping.fullName,
      businessName,
      orderNumber: order.orderNumber,
      lines: order.lines.map((line) => ({ name: line.name, price: line.price, quantity: line.quantity })),
      subtotal: order.subtotal,
      shippingFee: order.shippingFee,
      total: order.total,
      shippingMethodName: order.shipping.shippingMethodName,
    }),
  });

  if (!response.ok) {
    const json = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(json?.error ?? "We couldn't send the order confirmation email.");
  }
}
