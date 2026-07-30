/**
 * Phase 32 - Shipping. A single configurable shipping option, shown as a
 * choice at checkout alongside payment method (Phase 31's `PAYMENT_METHODS`
 * list is the closest existing shape - this mirrors it).
 */
export interface ShippingMethod {
  /** Stable id, referenced by `CheckoutFormData.shippingMethodId`. */
  id: string;
  name: string;
  description?: string;
  /** Flat rate in pesos, charged unless `freeThreshold` waives it. */
  rate: number;
  /** Subtotal (pesos) at or above which this method's fee is waived. Omit for no free-shipping threshold on this method. */
  freeThreshold?: number;
  /**
   * Provinces (matched case-insensitively against the shipping address's
   * province field) this method is limited to - a simple shipping-zone
   * mechanism. Omit or leave empty for a nationwide method available
   * regardless of province.
   */
  provinces?: string[];
}
