import { afterEach, describe, expect, it, vi } from "vitest";
import handler from "./attach-payment-method";
import type { ApiRequest } from "./_shared";

function fakeRes() {
  const res = {
    statusCode: 200,
    body: undefined as unknown,
    status(code: number) {
      res.statusCode = code;
      return res;
    },
    json(payload: unknown) {
      res.body = payload;
    },
  };
  return res;
}

function jsonResponse(body: unknown, ok = true, status = ok ? 200 : 400): Response {
  return { ok, status, json: () => Promise.resolve(body) } as Response;
}

const VALID_BODY = { paymentIntentId: "pi_123", paymentMethodId: "pm_123", returnUrl: "https://example.com/checkout/payment-return" };

describe("POST /api/paymongo/attach-payment-method", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("rejects non-POST methods", async () => {
    const res = fakeRes();
    await handler({ method: "GET" } as ApiRequest, res);
    expect(res.statusCode).toBe(405);
  });

  it("rejects a body missing required fields", async () => {
    vi.stubEnv("PAYMONGO_SECRET_KEY", "sk_test_abc");
    const res = fakeRes();
    await handler({ method: "POST", body: { paymentIntentId: "pi_123" } } as ApiRequest, res);
    expect(res.statusCode).toBe(400);
  });

  it("returns succeeded with no redirect url for an immediate charge", async () => {
    vi.stubEnv("PAYMONGO_SECRET_KEY", "sk_test_abc");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({ data: { attributes: { status: "succeeded", next_action: null } } })),
    );

    const res = fakeRes();
    await handler({ method: "POST", body: VALID_BODY } as ApiRequest, res);

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ status: "succeeded", nextActionUrl: null });
  });

  it("extracts the 3D Secure redirect url when one is present", async () => {
    vi.stubEnv("PAYMONGO_SECRET_KEY", "sk_test_abc");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse({
          data: { attributes: { status: "awaiting_next_action", next_action: { redirect: { url: "https://paymongo.test/3ds" } } } },
        }),
      ),
    );

    const res = fakeRes();
    await handler({ method: "POST", body: VALID_BODY } as ApiRequest, res);

    expect(res.body).toEqual({ status: "awaiting_next_action", nextActionUrl: "https://paymongo.test/3ds" });
  });

  it("attaches using the secret key, without ever sending a client_key", async () => {
    vi.stubEnv("PAYMONGO_SECRET_KEY", "sk_test_abc");
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ data: { attributes: { status: "succeeded" } } }));
    vi.stubGlobal("fetch", fetchMock);

    await handler({ method: "POST", body: VALID_BODY } as ApiRequest, fakeRes());

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.paymongo.com/v1/payment_intents/pi_123/attach");
    expect((init.headers as Record<string, string>).Authorization).toBe(`Basic ${Buffer.from("sk_test_abc:").toString("base64")}`);
    const body = JSON.parse(init.body as string);
    expect(body.data.attributes.payment_method).toBe("pm_123");
    expect(body.data.attributes.return_url).toBe("https://example.com/checkout/payment-return");
    expect(body.data.attributes.client_key).toBeUndefined();
  });

  it("relays a PayMongo decline as a 4xx", async () => {
    vi.stubEnv("PAYMONGO_SECRET_KEY", "sk_test_abc");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ errors: [{ detail: "The card was declined." }] }, false, 402)));

    const res = fakeRes();
    await handler({ method: "POST", body: VALID_BODY } as ApiRequest, res);

    expect(res.statusCode).toBe(402);
    expect(res.body).toEqual({ error: "The card was declined." });
  });
});
