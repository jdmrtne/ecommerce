/**
 * Phase 31 - Payments. Shared by every function in `api/paymongo/` -
 * these are the only places `PAYMONGO_SECRET_KEY` is read. Deployed as
 * Vercel serverless functions (this project's existing host - see
 * `vercel.json`); anything under `api/` with a default-exported handler
 * is picked up automatically, no extra config needed beyond the
 * `/api/(.*)`, exclusion already added to `vercel.json`'s SPA rewrite.
 *
 * Not part of the Vite app - these run in a Node serverless runtime, not
 * the browser, hence `process.env` (not `import.meta.env`) and their own
 * `tsconfig.api.json` project (see root `tsconfig.json`).
 */

export const PAYMONGO_API = "https://api.paymongo.com/v1";

export function secretKey(): string {
  const key = process.env.PAYMONGO_SECRET_KEY;
  if (!key) {
    throw new MissingSecretKeyError();
  }
  return key;
}

export class MissingSecretKeyError extends Error {
  constructor() {
    super("PAYMONGO_SECRET_KEY is not configured on the server.");
    this.name = "MissingSecretKeyError";
  }
}

export function basicAuthHeader(key: string): string {
  return `Basic ${Buffer.from(`${key}:`).toString("base64")}`;
}

/** Extracts a shopper-readable message from a PayMongo error response body. */
export function extractPaymongoError(json: unknown, fallback: string): string {
  if (json && typeof json === "object" && "errors" in json) {
    const errors = (json as { errors?: unknown }).errors;
    if (Array.isArray(errors) && errors.length > 0) {
      const first = errors[0] as { detail?: unknown };
      if (typeof first.detail === "string") return first.detail;
    }
  }
  return fallback;
}

/** Minimal request/response shape this project's serverless functions need - matches Vercel's Node runtime (a superset of Node's http types) without adding a runtime dependency on `@vercel/node`. */
export interface ApiRequest {
  method?: string;
  body?: unknown;
  query?: Partial<Record<string, string | string[]>>;
}

export interface ApiResponse {
  status(code: number): ApiResponse;
  json(body: unknown): void;
}
