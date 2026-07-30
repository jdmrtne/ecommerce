import type { ApiRequest, ApiResponse } from "./_shared.js";
import { PAYMONGO_API, MissingSecretKeyError, basicAuthHeader, extractPaymongoError, secretKey } from "./_shared.js";

interface PaymongoAttachResponse {
  data?: {
    attributes: {
      status: string;
      next_action?: { redirect?: { url?: string } } | null;
    };
  };
}

/**
 * Attaches a previously-created Payment Method (tokenized client-side
 * with the public key - see `lib/payments/paymongo.ts`) to a Payment
 * Intent. Done server-side with the secret key, per PayMongo's own
 * recommendation ("we do recommend that ... the Attach API call is done
 * on the server side") - this also means the client never needs the
 * intent's `client_key` at all, one less value to pass around.
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

  const body = (req.body ?? {}) as { paymentIntentId?: unknown; paymentMethodId?: unknown; returnUrl?: unknown };
  const { paymentIntentId, paymentMethodId, returnUrl } = body;
  if (typeof paymentIntentId !== "string" || typeof paymentMethodId !== "string" || typeof returnUrl !== "string") {
    res.status(400).json({ error: "Missing required payment details." });
    return;
  }

  const response = await fetch(`${PAYMONGO_API}/payment_intents/${encodeURIComponent(paymentIntentId)}/attach`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: basicAuthHeader(key),
    },
    body: JSON.stringify({
      data: {
        attributes: {
          payment_method: paymentMethodId,
          return_url: returnUrl,
        },
      },
    }),
  });

  const json = (await response.json()) as PaymongoAttachResponse;
  if (!response.ok || !json.data) {
    res.status(response.status || 502).json({ error: extractPaymongoError(json, "Your payment could not be processed. Please try again.") });
    return;
  }

  res.status(200).json({
    status: json.data.attributes.status,
    nextActionUrl: json.data.attributes.next_action?.redirect?.url ?? null,
  });
}
