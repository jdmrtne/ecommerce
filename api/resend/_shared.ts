/**
 * Phase 33 - Notifications. Shared by every function in `api/resend/` -
 * the only places `RESEND_API_KEY` is read. Same shape as
 * `api/paymongo/_shared.ts`: Vercel serverless functions (this project's
 * existing host - see `vercel.json`), `process.env` (not
 * `import.meta.env`) since these run in a Node serverless runtime, not
 * the browser, and their own `tsconfig.api.json` project.
 *
 * No `resend` npm package - a plain `fetch` against Resend's REST API is
 * enough for the one call this app makes, and keeps this dependency-free
 * the same way `api/paymongo/` talks to PayMongo directly.
 */

export const RESEND_API = "https://api.resend.com/emails";

export function resendApiKey(): string {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    throw new MissingApiKeyError();
  }
  return key;
}

/**
 * The "from" address Resend sends as - must be on a domain verified with
 * Resend (see their dashboard). Not `VITE_`-prefixed for the same reason
 * as the API key: this only ever needs to be known server-side.
 */
export function resendFromAddress(): string {
  return process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
}

export class MissingApiKeyError extends Error {
  constructor() {
    super("RESEND_API_KEY is not configured on the server.");
    this.name = "MissingApiKeyError";
  }
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
