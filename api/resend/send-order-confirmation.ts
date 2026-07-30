import type { ApiRequest, ApiResponse } from "./_shared";
import { MissingApiKeyError, RESEND_API, resendApiKey, resendFromAddress } from "./_shared";

interface EmailOrderLine {
  name: string;
  price: number;
  quantity: number;
}

interface SendOrderConfirmationBody {
  to?: unknown;
  customerName?: unknown;
  businessName?: unknown;
  orderNumber?: unknown;
  lines?: unknown;
  subtotal?: unknown;
  shippingFee?: unknown;
  total?: unknown;
  shippingMethodName?: unknown;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PESO = new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 });

function isOrderLine(value: unknown): value is EmailOrderLine {
  if (!value || typeof value !== "object") return false;
  const line = value as Record<string, unknown>;
  return typeof line.name === "string" && typeof line.price === "number" && typeof line.quantity === "number";
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char] as string);
}

function buildEmailHtml(params: {
  businessName: string;
  customerName: string;
  orderNumber: string;
  lines: EmailOrderLine[];
  subtotal: number;
  shippingFee: number;
  total: number;
  shippingMethodName: string;
}): string {
  const rows = params.lines
    .map(
      (line) =>
        `<tr><td style="padding:4px 8px;">${escapeHtml(line.name)} &times; ${line.quantity}</td><td style="padding:4px 8px;text-align:right;">${PESO.format(line.price * line.quantity)}</td></tr>`,
    )
    .join("");

  return `
    <div style="font-family:sans-serif;color:#222;max-width:480px;margin:0 auto;">
      <h2>Thanks for your order, ${escapeHtml(params.customerName)}!</h2>
      <p>Your order <strong>${escapeHtml(params.orderNumber)}</strong> has been placed with ${escapeHtml(params.businessName)}.</p>
      <table style="width:100%;border-collapse:collapse;margin-top:16px;">
        ${rows}
        <tr><td style="padding:4px 8px;">Shipping (${escapeHtml(params.shippingMethodName)})</td><td style="padding:4px 8px;text-align:right;">${params.shippingFee === 0 ? "Free" : PESO.format(params.shippingFee)}</td></tr>
        <tr><td style="padding:4px 8px;">Subtotal</td><td style="padding:4px 8px;text-align:right;">${PESO.format(params.subtotal)}</td></tr>
        <tr style="font-weight:bold;"><td style="padding:8px;border-top:1px solid #ddd;">Total</td><td style="padding:8px;border-top:1px solid #ddd;text-align:right;">${PESO.format(params.total)}</td></tr>
      </table>
      <p style="margin-top:24px;color:#666;font-size:13px;">If you have any questions about your order, just reply to this email.</p>
    </div>
  `.trim();
}

/**
 * Sends a shopper an order-confirmation email via Resend, right after
 * their order is built (either the immediate cod/gcash/non-3DS-card
 * path in `Checkout.tsx`, or the 3DS return trip in
 * `CheckoutPaymentReturn.tsx` - see `lib/notifications/notify.ts`'s
 * `notifyOrderPlaced()`, the one call site both paths share). Runs for
 * *every* checkout, signed-in or guest - unlike the in-app notification
 * (which needs an owner row to write to), an email just needs an
 * address, so this is the only notification a guest shopper gets.
 *
 * Best-effort from the caller's point of view: `notifyOrderPlaced()`
 * never lets a failure here block or fail the checkout that already
 * succeeded - see that file's doc comment.
 */
export default async function handler(req: ApiRequest, res: ApiResponse): Promise<void> {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed." });
    return;
  }

  let key: string;
  try {
    key = resendApiKey();
  } catch (err) {
    if (err instanceof MissingApiKeyError) {
      res.status(500).json({ error: "Order emails aren't configured on the server yet." });
      return;
    }
    throw err;
  }

  const body = (req.body ?? {}) as SendOrderConfirmationBody;
  const { to, customerName, businessName, orderNumber, lines, subtotal, shippingFee, total, shippingMethodName } = body;

  if (typeof to !== "string" || !EMAIL_PATTERN.test(to)) {
    res.status(400).json({ error: "A valid recipient email is required." });
    return;
  }
  if (typeof orderNumber !== "string" || !orderNumber) {
    res.status(400).json({ error: "An order number is required." });
    return;
  }
  if (!Array.isArray(lines) || lines.length === 0 || !lines.every(isOrderLine)) {
    res.status(400).json({ error: "Order line items are required." });
    return;
  }
  if (typeof subtotal !== "number" || typeof shippingFee !== "number" || typeof total !== "number") {
    res.status(400).json({ error: "Order totals are required." });
    return;
  }

  const html = buildEmailHtml({
    businessName: typeof businessName === "string" && businessName ? businessName : "our store",
    customerName: typeof customerName === "string" && customerName ? customerName : "there",
    orderNumber,
    lines,
    subtotal,
    shippingFee,
    total,
    shippingMethodName: typeof shippingMethodName === "string" ? shippingMethodName : "Standard Shipping",
  });

  const response = await fetch(RESEND_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      from: resendFromAddress(),
      to: [to],
      subject: `Order confirmed - ${orderNumber}`,
      html,
    }),
  });

  if (!response.ok) {
    const json = (await response.json().catch(() => null)) as { message?: string } | null;
    res.status(response.status || 502).json({ error: json?.message ?? "We couldn't send your order confirmation email." });
    return;
  }

  res.status(200).json({ sent: true });
}
