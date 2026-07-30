import type { SupabaseClient } from "@supabase/supabase-js";
import type { Order } from "@/types/order";
import { apiCreateNotification } from "@/lib/api/notifications";
import { sendOrderConfirmationEmail } from "@/lib/notifications/email";

/**
 * Phase 33 - Notifications. The one call site both order-completion
 * paths share (`Checkout.tsx`'s immediate cod/gcash/non-3DS-card
 * success, and `CheckoutPaymentReturn.tsx`'s 3DS return trip) so the
 * "what happens after an order is placed" logic lives in exactly one
 * place, not duplicated across two components.
 *
 * Deliberately never throws: by the time this runs, the order has
 * already been placed (and, for a card payment, already charged) - a
 * failure to notify the shopper shouldn't undo that or show them an
 * error about a purchase that actually succeeded. Both the email send
 * and the in-app notification insert are individually best-effort;
 * either can fail independently without affecting the other, and
 * either failing just means a `console.warn` (not silent - a developer
 * checking a customer's "I never got my email" report can still find
 * this in server/browser logs) rather than a blocked or reverted
 * checkout. The provider is mocked at the module boundary in every test
 * that calls this, per Phase 33's own completion criteria.
 *
 * The in-app half only ever runs for a signed-in shopper - a guest
 * checkout has no `profiles`/auth-owned row to write a notification for
 * (see `supabase/schema.sql`'s owner-only RLS on `notifications`), so
 * `signedIn` gates it outright rather than attempting a write that RLS
 * would reject anyway.
 */
export async function notifyOrderPlaced(
  order: Order,
  businessName: string,
  signedIn: boolean,
  client?: SupabaseClient,
): Promise<void> {
  await sendOrderConfirmationEmail(order, businessName).catch((err) => {
    console.warn("Order confirmation email failed to send:", err);
  });

  if (!signedIn) return;

  await apiCreateNotification(
    order.shipping.email,
    {
      type: "order_placed",
      title: "Order placed",
      body: `Your order ${order.orderNumber} has been placed and is being processed.`,
      orderNumber: order.orderNumber,
    },
    client,
  ).catch((err) => {
    console.warn("In-app order notification failed to save:", err);
  });
}
