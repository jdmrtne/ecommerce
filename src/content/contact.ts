import { Mail, AtSign, Clock } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { BusinessConfig } from "@/config/business";

export interface ContactIntroContent {
  eyebrow: string;
  title: string;
  description: string;
}

/**
 * Heading copy for the /contact page intro. Previously hardcoded directly
 * in `Contact.tsx` - moved here as part of the Phase 11 section split so
 * every section's copy has one home in `content/`, matching the rule
 * already enforced everywhere else since Phase 8.
 */
export const CONTACT_INTRO: ContactIntroContent = {
  eyebrow: "Say hello",
  title: "Get in touch",
  description:
    "Custom colors, bulk gifting, or just curious about a piece - reach out any of these ways, or send a message directly.",
};

export interface ContactPoint {
  icon: LucideIcon;
  label: string;
  value: string;
  href?: string;
}

/**
 * Contact points shown on the homepage teaser and /contact page, derived
 * from a `BusinessConfig` rather than hardcoded here. Takes the config as
 * a parameter (instead of importing the static `business` default and
 * computing this once at module load, as before Phase 16) so callers can
 * pass the *resolved* config from `useStoreSettings()` - editing Store
 * Settings then updates this everywhere it's shown without a reload.
 */
export function getContactPoints(business: BusinessConfig): ContactPoint[] {
  return [
    {
      icon: Mail,
      label: "Email",
      value: business.email,
      href: `mailto:${business.email}`,
    },
    {
      icon: AtSign,
      label: "Instagram DMs",
      value: business.social.instagramHandle ?? "",
      href: business.social.instagram ?? "#",
    },
    {
      icon: Clock,
      label: "Response time",
      value: business.responseTime,
    },
  ].filter((point) => point.value);
}
