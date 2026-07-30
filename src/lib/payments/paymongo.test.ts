import { afterEach, describe, expect, it, vi } from "vitest";
import {
  attachPaymentMethod,
  createPaymentIntent,
  createPaymentMethod,
  retrievePaymentIntent,
} from "@/lib/payments/paymongo";

function jsonResponse(body: unknown, ok = true, status = ok ? 200 : 400): Response {
  return {
    ok,
    status,
    json: () => Promise.resolve(body),
  } as Response;
}

const CARD = { number: "4343 4343 4343 4345", name: "Jude Tambago", expMonth: 12, expYear: 2030, cvc: "123" };

describe("paymongo client helpers", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  describe("createPaymentMethod", () => {
    it("sends stripped card details to PayMongo directly, authenticated with the public key", async () => {
      vi.stubEnv("VITE_PAYMONGO_PUBLIC_KEY", "pk_test_abc");
      const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ data: { id: "pm_123" } }));
      vi.stubGlobal("fetch", fetchMock);

      const id = await createPaymentMethod(CARD);

      expect(id).toBe("pm_123");
      const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(url).toBe("https://api.paymongo.com/v1/payment_methods");
      expect((init.headers as Record<string, string>).Authorization).toBe(`Basic ${btoa("pk_test_abc:")}`);
      const body = JSON.parse(init.body as string);
      expect(body.data.attributes.details.card_number).toBe("4343434343434345");
      expect(body.data.attributes.details.exp_month).toBe(12);
      expect(body.data.attributes.billing.name).toBe("Jude Tambago");
    });

    it("throws a shopper-readable message when PayMongo rejects the card", async () => {
      vi.stubEnv("VITE_PAYMONGO_PUBLIC_KEY", "pk_test_abc");
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue(jsonResponse({ errors: [{ detail: "The card number is invalid." }] }, false, 400)),
      );

      await expect(createPaymentMethod(CARD)).rejects.toThrow("The card number is invalid.");
    });

    it("throws before making a network call when the public key isn't configured", async () => {
      vi.stubEnv("VITE_PAYMONGO_PUBLIC_KEY", "");
      const fetchMock = vi.fn();
      vi.stubGlobal("fetch", fetchMock);

      await expect(createPaymentMethod(CARD)).rejects.toThrow(/aren't configured/);
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  describe("createPaymentIntent", () => {
    it("posts the centavo amount and description to this app's own serverless function", async () => {
      const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ id: "pi_123", status: "awaiting_payment_method" }));
      vi.stubGlobal("fetch", fetchMock);

      const intent = await createPaymentIntent(15800, "Order CV-123456");

      expect(intent).toEqual({ id: "pi_123" });
      const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(url).toBe("/api/paymongo/create-intent");
      expect(JSON.parse(init.body as string)).toEqual({ amount: 15800, description: "Order CV-123456" });
    });
  });

  describe("attachPaymentMethod", () => {
    it("returns succeeded with no redirect url when the charge completes immediately", async () => {
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ status: "succeeded", nextActionUrl: null })));

      const result = await attachPaymentMethod("pi_123", "pm_123", "https://example.com/checkout/payment-return");
      expect(result).toEqual({ status: "succeeded", nextActionUrl: null });
    });

    it("returns the 3DS redirect url when the card requires authentication", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue(
          jsonResponse({ status: "awaiting_next_action", nextActionUrl: "https://paymongo.test/3ds" }),
        ),
      );

      const result = await attachPaymentMethod("pi_123", "pm_123", "https://example.com/checkout/payment-return");
      expect(result.status).toBe("awaiting_next_action");
      expect(result.nextActionUrl).toBe("https://paymongo.test/3ds");
    });
  });

  describe("retrievePaymentIntent", () => {
    it("fetches status by id from this app's own serverless function", async () => {
      const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ status: "succeeded" }));
      vi.stubGlobal("fetch", fetchMock);

      const status = await retrievePaymentIntent("pi_123");

      expect(status).toBe("succeeded");
      expect(fetchMock).toHaveBeenCalledWith("/api/paymongo/payment-intent-status?id=pi_123");
    });
  });
});
