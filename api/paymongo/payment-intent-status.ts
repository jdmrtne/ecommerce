import type { ApiRequest, ApiResponse } from "./_shared.js";
import { PAYMONGO_API, MissingSecretKeyError, basicAuthHeader, extractPaymongoError, secretKey } from "./_shared.js";

/**
 * `CheckoutPaymentReturn.tsx` calls this after a 3D Secure redirect
 * brings the shopper back to the app, to find out whether the
 * authentication actually resulted in a successful charge.
 */
export default async function handler(req: ApiRequest, res: ApiResponse): Promise<void> {
  if (req.method !== "GET") {
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

  const idParam = req.query?.id;
  const id = Array.isArray(idParam) ? idParam[0] : idParam;
  if (!id) {
    res.status(400).json({ error: "Missing payment intent id." });
    return;
  }

  const response = await fetch(`${PAYMONGO_API}/payment_intents/${encodeURIComponent(id)}`, {
    method: "GET",
    headers: { Authorization: basicAuthHeader(key) },
  });

  const json = (await response.json()) as { data?: { attributes: { status: string } } };
  if (!response.ok || !json.data) {
    res.status(response.status || 502).json({ error: extractPaymongoError(json, "We couldn't confirm your payment status.") });
    return;
  }

  res.status(200).json({ status: json.data.attributes.status });
}
