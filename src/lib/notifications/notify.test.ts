import { afterEach, describe, expect, it, vi } from "vitest";
import { notifyOrderPlaced } from "@/lib/notifications/notify";
import { sendOrderConfirmationEmail } from "@/lib/notifications/email";
import { apiCreateNotification } from "@/lib/api/notifications";
import type { Order } from "@/types/order";

vi.mock("@/lib/notifications/email", () => ({
  sendOrderConfirmationEmail: vi.fn(),
}));

vi.mock("@/lib/api/notifications", () => ({
  apiCreateNotification: vi.fn(),
}));

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

describe("notifyOrderPlaced", () => {
  afterEach(() => {
    vi.mocked(sendOrderConfirmationEmail).mockReset();
    vi.mocked(apiCreateNotification).mockReset();
  });

  it("sends the confirmation email and saves an in-app notification for a signed-in shopper", async () => {
    vi.mocked(sendOrderConfirmationEmail).mockResolvedValue(undefined);
    vi.mocked(apiCreateNotification).mockResolvedValue(undefined);

    await notifyOrderPlaced(ORDER, "My Business", true);

    expect(sendOrderConfirmationEmail).toHaveBeenCalledWith(ORDER, "My Business");
    expect(apiCreateNotification).toHaveBeenCalledWith(
      "jude@example.com",
      expect.objectContaining({ type: "order_placed", orderNumber: "CVE-0001" }),
      undefined,
    );
  });

  it("only sends the email, skipping the in-app notification, for a guest checkout", async () => {
    vi.mocked(sendOrderConfirmationEmail).mockResolvedValue(undefined);

    await notifyOrderPlaced(ORDER, "My Business", false);

    expect(sendOrderConfirmationEmail).toHaveBeenCalled();
    expect(apiCreateNotification).not.toHaveBeenCalled();
  });

  it("never throws when the email send fails", async () => {
    vi.mocked(sendOrderConfirmationEmail).mockRejectedValue(new Error("network down"));
    vi.mocked(apiCreateNotification).mockResolvedValue(undefined);

    await expect(notifyOrderPlaced(ORDER, "My Business", true)).resolves.toBeUndefined();
    expect(apiCreateNotification).toHaveBeenCalled();
  });

  it("never throws when the in-app notification save fails", async () => {
    vi.mocked(sendOrderConfirmationEmail).mockResolvedValue(undefined);
    vi.mocked(apiCreateNotification).mockRejectedValue(new Error("RLS denied"));

    await expect(notifyOrderPlaced(ORDER, "My Business", true)).resolves.toBeUndefined();
  });
});
