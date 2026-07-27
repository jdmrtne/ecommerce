const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface StoreSettingsFormValues {
  businessName: string;
  email: string;
}

export interface StoreSettingsFormErrors {
  businessName?: string;
  email?: string;
}

/**
 * Validation for the Store Settings admin form (Phase 16). Deliberately
 * minimal - `businessName` and `email` are the only fields the rest of
 * the app actually depends on being non-empty/well-formed (nav/footer
 * always render a business name; `mailto:` links and the contact form
 * need a real-looking address) - everything else on the form is free
 * text with no downstream parsing.
 */
export function validateStoreSettings(values: StoreSettingsFormValues): StoreSettingsFormErrors {
  const errors: StoreSettingsFormErrors = {};
  if (!values.businessName.trim()) errors.businessName = "Business name is required.";
  if (values.email.trim() && !EMAIL_PATTERN.test(values.email)) {
    errors.email = "Please enter a valid email address.";
  }
  return errors;
}
