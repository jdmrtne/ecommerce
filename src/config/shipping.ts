import type { ShippingMethod } from "@/types/shipping";

/**
 * Static default shipping methods, overridable through the admin Shipping
 * Editor (Phase 32) via `lib/shippingSettingsStore.ts`, same
 * override-over-defaults pattern as every other admin editor.
 *
 * The one entry here preserves this template's pre-Phase-32 checkout
 * behavior exactly (it used to be a hardcoded `SHIPPING_FEE`/
 * `FREE_SHIPPING_THRESHOLD` pair in `lib/checkout.ts`): a flat ₱80,
 * waived at or above a ₱1,500 subtotal, with no province restriction (so
 * it's available nationwide) - a template with no admin customization
 * yet behaves identically to before this phase.
 */
export const DEFAULT_SHIPPING_METHODS: ShippingMethod[] = [
  {
    id: "standard",
    name: "Standard Shipping",
    description: "Delivered in 3-7 business days.",
    rate: 80,
    freeThreshold: 1500,
  },
];
