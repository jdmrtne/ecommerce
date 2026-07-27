/**
 * Policy text content. Routed at `/policies/:slug` by `pages/Policy.tsx`
 * (Phase 13) via `POLICY_PAGES` below, and linked from the footer's
 * "Help" group (`config/navigation.ts`).
 */

export interface PolicyDocument {
  title: string;
  lastUpdated: string;
  /** Each entry renders as a section with a heading and body paragraph(s). */
  sections: { heading: string; body: string }[];
}

export const PRIVACY_POLICY: PolicyDocument = {
  title: "Privacy Policy",
  lastUpdated: "2026-01-01",
  sections: [
    {
      heading: "Information we collect",
      body: "We collect the name, email, and shipping details you provide when creating an account, placing an order, or subscribing to our newsletter.",
    },
    {
      heading: "How we use it",
      body: "Your information is used to process orders, respond to inquiries, and - only if you opt in - send occasional updates about new products or restocks.",
    },
    {
      heading: "Sharing",
      body: "We do not sell your personal information. It is shared only with the services needed to fulfill your order, such as payment processing and shipping.",
    },
  ],
};

export const TERMS_OF_SERVICE: PolicyDocument = {
  title: "Terms of Service",
  lastUpdated: "2026-01-01",
  sections: [
    {
      heading: "Orders",
      body: "By placing an order, you agree to provide accurate shipping and payment information. Orders are confirmed once payment is received.",
    },
    {
      heading: "Product availability",
      body: "Items are subject to availability and may sell out. We will notify you if an item you ordered becomes unavailable.",
    },
  ],
};

export const SHIPPING_POLICY: PolicyDocument = {
  title: "Shipping Policy",
  lastUpdated: "2026-01-01",
  sections: [
    {
      heading: "Processing time",
      body: "Replace this with your store's typical processing time before an order ships.",
    },
    {
      heading: "Delivery estimates",
      body: "Replace this with your store's estimated delivery windows by region.",
    },
  ],
};

export const RETURN_POLICY: PolicyDocument = {
  title: "Return & Exchange Policy",
  lastUpdated: "2026-01-01",
  sections: [
    {
      heading: "Change of mind",
      body: "Replace this with your store's policy on change-of-mind returns.",
    },
    {
      heading: "Damaged or incorrect items",
      body: "If an item arrives damaged or incorrect, contact us within 7 days of delivery and we'll replace or refund it.",
    },
  ],
};

/** URL slug for each policy document, as used in `/policies/:slug`. */
export type PolicySlug = "privacy" | "terms" | "shipping" | "returns";

/**
 * Slug -> document lookup, read by `pages/Policy.tsx`. This is the one
 * place a new policy page needs registering - after that, only a footer
 * link (`config/navigation.ts`) needs to point at `/policies/<slug>`.
 */
export const POLICY_PAGES: Record<PolicySlug, PolicyDocument> = {
  privacy: PRIVACY_POLICY,
  terms: TERMS_OF_SERVICE,
  shipping: SHIPPING_POLICY,
  returns: RETURN_POLICY,
};
