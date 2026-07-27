/**
 * Business/contact information - the operational facts about the store,
 * as opposed to branding (identity) or content (marketing copy).
 *
 * Every page that shows an address, phone number, social link, or
 * business hour should read from here rather than hardcoding it.
 */
export interface BusinessHours {
  days: string;
  hours: string;
}

export interface SocialLinks {
  facebook?: string;
  instagram?: string;
  tiktok?: string;
  messenger?: string;
  /** Handle shown in UI, e.g. "@yourbusiness" (without a link). */
  instagramHandle?: string;
}

export interface BusinessConfig {
  legalName: string;
  address: string;
  /** Public contact email, shown on Contact page and used for mailto: links. */
  email: string;
  phone?: string;
  hours: BusinessHours[];
  social: SocialLinks;
  /** Embeddable/linkable Google Maps URL for the store address. */
  googleMapsUrl?: string;
  /** Typical response time shown on the Contact page. */
  responseTime: string;
}

export const business: BusinessConfig = {
  legalName: "My Business",
  address: "Your Business Address",
  email: "contact@example.com",
  phone: "+63 XXX XXX XXXX",
  hours: [{ days: "Monday - Saturday", hours: "9:00 AM - 6:00 PM" }],
  social: {
    facebook: "#",
    instagram: "#",
    instagramHandle: "@yourbusiness",
    tiktok: undefined,
    messenger: undefined,
  },
  googleMapsUrl: undefined,
  responseTime: "Usually within 1 business day",
};
