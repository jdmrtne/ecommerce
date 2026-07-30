import { afterEach, describe, expect, it, vi } from "vitest";
import handler from "./create-intent";
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

describe("POST /api/paymongo/create-intent", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("rejects non-POST methods", async () => {
    const res = fakeRes();
    await handler({ method: "GET" } as ApiRequest, res);
    expect(res.statusCode).toBe(405);
  });

  it("returns 500 without calling PayMongo when the secret key isn't configured", async () => {
    vi.stubEnv("PAYMONGO_SECRET_KEY", "");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const res = fakeRes();
    await handler({ method: "POST", body: { amount: 15800 } } as ApiRequest, res);

    expect(res.statusCode).toBe(500);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects a missing or invalid amount", async () => {
    vi.stubEnv("PAYMONGO_SECRET_KEY", "sk_test_abc");
    const res = fakeRes();
    await handler({ method: "POST", body: {} } as ApiRequest, res);
    expect(res.statusCode).toBe(400);

    const res2 = fakeRes();
    await handler({ method: "POST", body: { amount: 50 } } as ApiRequest, res2); // below the 100-centavo floor
    expect(res2.statusCode).toBe(400);
  });

  it("creates a PHP payment intent authenticated with the secret key and returns its id/status", async () => {
    vi.stubEnv("PAYMONGO_SECRET_KEY", "sk_test_abc");
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse({ data: { id: "pi_123", attributes: { client_key: "ck_123", status: "awaiting_payment_method" } } }));
    vi.stubGlobal("fetch", fetchMock);

    const res = fakeRes();
    await handler({ method: "POST", body: { amount: 15800, description: "Order CV-123456" } } as ApiRequest, res);

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ id: "pi_123", status: "awaiting_payment_method" });

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.paymongo.com/v1/payment_intents");
    expect((init.headers as Record<string, string>).Authorization).toBe(`Basic ${Buffer.from("sk_test_abc:").toString("base64")}`);
    const body = JSON.parse(init.body as string);
    expect(body.data.attributes.amount).toBe(15800);
    expect(body.data.attributes.currency).toBe("PHP");
    expect(body.data.attributes.payment_method_allowed).toEqual(["card"]);
  });

  it("relays a PayMongo error as a 4xx with a readable message", async () => {
    vi.stubEnv("PAYMONGO_SECRET_KEY", "sk_test_abc");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ errors: [{ detail: "Amount is too small." }] }, false, 400)));

    const res = fakeRes();
    await handler({ method: "POST", body: { amount: 15800 } } as ApiRequest, res);

    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ error: "Amount is too small." });
  });
});
