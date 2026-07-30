import { afterEach, describe, expect, it, vi } from "vitest";
import handler from "./send-order-confirmation";
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

const VALID_BODY = {
  to: "jude@example.com",
  customerName: "Jude Tambago",
  businessName: "My Business",
  orderNumber: "CVE-0001",
  lines: [{ name: "Woven Basket", price: 450, quantity: 1 }],
  subtotal: 450,
  shippingFee: 60,
  total: 510,
  shippingMethodName: "Standard Shipping",
};

describe("POST /api/resend/send-order-confirmation", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("rejects non-POST methods", async () => {
    const res = fakeRes();
    await handler({ method: "GET" } as ApiRequest, res);
    expect(res.statusCode).toBe(405);
  });

  it("returns 500 without calling Resend when the API key isn't configured", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const res = fakeRes();
    await handler({ method: "POST", body: VALID_BODY } as ApiRequest, res);

    expect(res.statusCode).toBe(500);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects a missing or invalid recipient email", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_test_abc");
    const res = fakeRes();
    await handler({ method: "POST", body: { ...VALID_BODY, to: "not-an-email" } } as ApiRequest, res);
    expect(res.statusCode).toBe(400);
  });

  it("rejects a missing order number", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_test_abc");
    const res = fakeRes();
    await handler({ method: "POST", body: { ...VALID_BODY, orderNumber: "" } } as ApiRequest, res);
    expect(res.statusCode).toBe(400);
  });

  it("rejects missing or malformed line items", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_test_abc");
    const res = fakeRes();
    await handler({ method: "POST", body: { ...VALID_BODY, lines: [] } } as ApiRequest, res);
    expect(res.statusCode).toBe(400);

    const res2 = fakeRes();
    await handler({ method: "POST", body: { ...VALID_BODY, lines: [{ name: "Basket" }] } } as ApiRequest, res2);
    expect(res2.statusCode).toBe(400);
  });

  it("sends the email via Resend, authenticated with the API key, and returns sent: true", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_test_abc");
    vi.stubEnv("RESEND_FROM_EMAIL", "orders@example.com");
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ id: "email_123" }));
    vi.stubGlobal("fetch", fetchMock);

    const res = fakeRes();
    await handler({ method: "POST", body: VALID_BODY } as ApiRequest, res);

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ sent: true });

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.resend.com/emails");
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer re_test_abc");
    const payload = JSON.parse(init.body as string);
    expect(payload.from).toBe("orders@example.com");
    expect(payload.to).toEqual(["jude@example.com"]);
    expect(payload.subject).toContain("CVE-0001");
    expect(payload.html).toContain("Woven Basket");
  });

  it("falls back to the default Resend sender when RESEND_FROM_EMAIL isn't set", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_test_abc");
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ id: "email_123" }));
    vi.stubGlobal("fetch", fetchMock);

    const res = fakeRes();
    await handler({ method: "POST", body: VALID_BODY } as ApiRequest, res);

    expect(res.statusCode).toBe(200);
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const payload = JSON.parse(init.body as string);
    expect(payload.from).toBe("onboarding@resend.dev");
  });

  it("relays a Resend error as a matching status code with a readable message", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_test_abc");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ message: "Invalid `to` field." }, false, 422)));

    const res = fakeRes();
    await handler({ method: "POST", body: VALID_BODY } as ApiRequest, res);

    expect(res.statusCode).toBe(422);
    expect(res.body).toEqual({ error: "Invalid `to` field." });
  });
});
