/**
 * Phase 31 - Payments. Types for the PayMongo card-payment flow. Kept
 * deliberately narrow - only the fields this app actually reads from
 * PayMongo's responses, not a full mirror of their API schema.
 */

/** Raw card entry fields collected on the Checkout form for the "card" payment method. */
export interface CardDetails {
  /** Digits only (spaces are stripped before this is set). */
  number: string;
  name: string;
  /** 1-12. */
  expMonth: number;
  /** 4-digit year. */
  expYear: number;
  cvc: string;
}

/**
 * The subset of PayMongo Payment Intent statuses this app branches on.
 * PayMongo's full enum also includes "awaiting_payment_method" (the
 * intent's starting state, and where it returns to after a failed
 * attach) - treated the same as "failed" here since this app never
 * retries an intent, it creates a fresh one per submit.
 */
export type PaymentIntentStatus =
  | "awaiting_payment_method"
  | "awaiting_next_action"
  | "processing"
  | "succeeded";

export interface PaymentIntentRef {
  id: string;
}

export interface AttachPaymentMethodResult {
  status: PaymentIntentStatus;
  /** Present only when status is "awaiting_next_action" - where to send the shopper for 3D Secure authentication. */
  nextActionUrl: string | null;
}
