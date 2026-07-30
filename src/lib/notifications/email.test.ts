import { afterEach, describe, expect, it, vi } from "vitest";
import { sendOrderConfirmationEmail } from "@/lib/notifications/email";
import type { Order } from "@/types/order";

const ORDER: Order = {
  orderNumber: "CVE-0001",
  placedAt: "2026-01-01T00:00:00.000Z",
  lines: [{ productId: "prod-1", name: "Woven Basket", price: 450, quantity: 1 }],
  subtotal: 450,
  shippingFee: 60,
  total: 510,
  shipping: {
    fullName: "Jude Tambago",
    email: "jude@example.com",
    phone: "0950 701 9941",
    address: "123 St",
    city: "Caloocan",
    province: "Metro Manila",
    zip: "1400",
    paymentMethod: "cod",
    shippingMethodId: "standard",
    shippingMethodName: "Standard Shipping",
    notes: "",
  },
};

function jsonResponse(body: unknown, ok = true, status = ok ? 200 : 400): Response {
  return { ok, status, json: () => Promise.resolve(body) } as Response;
}

describe("sendOrderConfirmationEmail", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("posts the order details to this app's own /api/resend endpoint", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ sent: true }));
    vi.stubGlobal("fetch", fetchMock);

    await sendOrderConfirmationEmail(ORDER, "My Business");

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("/api/resend/send-order-confirmation");
    const body = JSON.parse(init.body as string);
    expect(body.to).toBe("jude@example.com");
    expect(body.customerName).toBe("Jude Tambago");
    expect(body.businessName).toBe("My Business");
    expect(body.orderNumber).toBe("CVE-0001");
    expect(body.lines).toEqual([{ name: "Woven Basket", price: 450, quantity: 1 }]);
    expect(body.total).toBe(510);
    expect(body.shippingMethodName).toBe("Standard Shipping");

    vi.unstubAllGlobals();
  });

  it("throws with the server's error message on failure", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ error: "Order emails aren't configured on the server yet." }, false, 500)));

    await expect(sendOrderConfirmationEmail(ORDER, "My Business")).rejects.toThrow(
      "Order emails aren't configured on the server yet.",
    );

    vi.unstubAllGlobals();
  });

  it("falls back to a generic message if the error response has no message", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({}, false, 500)));

    await expect(sendOrderConfirmationEmail(ORDER, "My Business")).rejects.toThrow(
      "We couldn't send the order confirmation email.",
    );

    vi.unstubAllGlobals();
  });
});
