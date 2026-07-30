import { afterEach, describe, expect, it, vi } from "vitest";
import handler from "./payment-intent-status";
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

describe("GET /api/paymongo/payment-intent-status", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("rejects non-GET methods", async () => {
    const res = fakeRes();
    await handler({ method: "POST" } as ApiRequest, res);
    expect(res.statusCode).toBe(405);
  });

  it("rejects a request with no id", async () => {
    vi.stubEnv("PAYMONGO_SECRET_KEY", "sk_test_abc");
    const res = fakeRes();
    await handler({ method: "GET", query: {} } as ApiRequest, res);
    expect(res.statusCode).toBe(400);
  });

  it("retrieves the intent status authenticated with the secret key", async () => {
    vi.stubEnv("PAYMONGO_SECRET_KEY", "sk_test_abc");
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ data: { attributes: { status: "succeeded" } } }));
    vi.stubGlobal("fetch", fetchMock);

    const res = fakeRes();
    await handler({ method: "GET", query: { id: "pi_123" } } as ApiRequest, res);

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ status: "succeeded" });
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.paymongo.com/v1/payment_intents/pi_123");
    expect((init.headers as Record<string, string>).Authorization).toBe(`Basic ${Buffer.from("sk_test_abc:").toString("base64")}`);
  });

  it("handles an id passed as an array (query param repeated) by using the first value", async () => {
    vi.stubEnv("PAYMONGO_SECRET_KEY", "sk_test_abc");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ data: { attributes: { status: "processing" } } })));

    const res = fakeRes();
    await handler({ method: "GET", query: { id: ["pi_123", "pi_456"] } } as ApiRequest, res);

    expect(res.body).toEqual({ status: "processing" });
  });

  it("relays a not-found intent as an error", async () => {
    vi.stubEnv("PAYMONGO_SECRET_KEY", "sk_test_abc");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ errors: [{ detail: "Resource not found." }] }, false, 404)));

    const res = fakeRes();
    await handler({ method: "GET", query: { id: "pi_does_not_exist" } } as ApiRequest, res);

    expect(res.statusCode).toBe(404);
    expect(res.body).toEqual({ error: "Resource not found." });
  });
});
