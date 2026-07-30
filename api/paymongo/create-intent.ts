import type { ApiRequest, ApiResponse } from "./_shared.js";
import { PAYMONGO_API, MissingSecretKeyError, basicAuthHeader, extractPaymongoError, secretKey } from "./_shared.js";

/**
 * Creates a PayMongo Payment Intent for the order total. Card-only for
 * now (`payment_method_allowed: ["card"]`) - this app only offers card
 * as a gateway-processed method (see `lib/checkout.ts`'s
 * `PAYMENT_METHODS`). `request_three_d_secure: "any"` follows PayMongo's
 * own guidance for the Philippines market, where 3DS is commonly
 * required by issuing banks; letting PayMongo decide per-card avoids
 * this app guessing which cards need it.
 */
export default async function handler(req: ApiRequest, res: ApiResponse): Promise<void> {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed." });
    return;
  }

  let key: string;
  try {
    key = secretKey();
  } catch (err) {
    if (err instanceof MissingSecretKeyError) {
      res.status(500).json({ error: "Card payments aren't configured on the server yet." });
      return;
    }
    throw err;
  }

  const body = (req.body ?? {}) as { amount?: unknown; description?: unknown };
  const amount = body.amount;
  if (typeof amount !== "number" || !Number.isInteger(amount) || amount < 100) {
    res.status(400).json({ error: "Invalid order amount." });
    return;
  }
  const description = typeof body.description === "string" ? body.description.slice(0, 255) : undefined;

  const response = await fetch(`${PAYMONGO_API}/payment_intents`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: basicAuthHeader(key),
    },
    body: JSON.stringify({
      data: {
        attributes: {
          amount,
          currency: "PHP",
          description,
          payment_method_allowed: ["card"],
          payment_method_options: { card: { request_three_d_secure: "any" } },
          capture_type: "automatic",
        },
      },
    }),
  });

  const json = (await response.json()) as { data?: { id: string; attributes: { client_key: string; status: string } } };
  if (!response.ok || !json.data) {
    res.status(response.status || 502).json({ error: extractPaymongoError(json, "We couldn't start your payment. Please try again.") });
    return;
  }

  res.status(200).json({ id: json.data.id, status: json.data.attributes.status });
}
