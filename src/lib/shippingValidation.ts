export interface ShippingMethodFormErrors {
  name?: string;
  rate?: string;
  freeThreshold?: string;
}

/**
 * Per-row validation for the Shipping Editor (Phase 32): every method
 * needs a non-empty name and a non-negative numeric rate. `freeThreshold`
 * is optional, but if present must also be a non-negative number.
 */
export function validateShippingMethod(method: {
  name: string;
  rate: string;
  freeThreshold: string;
}): ShippingMethodFormErrors {
  const errors: ShippingMethodFormErrors = {};
  if (!method.name.trim()) errors.name = "Name is required.";

  const rate = Number(method.rate);
  if (method.rate.trim() === "" || Number.isNaN(rate) || rate < 0) {
    errors.rate = "Enter a rate of 0 or more.";
  }

  if (method.freeThreshold.trim() !== "") {
    const freeThreshold = Number(method.freeThreshold);
    if (Number.isNaN(freeThreshold) || freeThreshold < 0) {
      errors.freeThreshold = "Enter a free-shipping subtotal of 0 or more, or leave it blank.";
    }
  }

  return errors;
}

/**
 * Validates the whole shipping method list for the Shipping Editor's save
 * action: every row must individually pass `validateShippingMethod()`, and
 * at least one method must remain (an empty checkout with nothing to
 * select is never a state the admin should be able to save).
 */
export function validateShippingMethods(
  methods: { name: string; rate: string; freeThreshold: string }[],
): { listError?: string; rowErrors: ShippingMethodFormErrors[] } {
  const rowErrors = methods.map((method) => validateShippingMethod(method));
  const listError = methods.length === 0 ? "Add at least one shipping method." : undefined;
  return { listError, rowErrors };
}

