import { branding } from "@/config/branding";
import { buildTitle } from "@/config/titleTemplate";

/**
 * Site-wide metadata (SEO/social preview defaults), separate from
 * `branding.ts` (visual identity) and `content/*.ts` (on-page copy).
 * Every route sets its own `<title>`/meta description via `useSiteMeta`
 * (see `src/hooks/useSiteMeta.ts`) using this file's defaults plus a
 * per-page override - so every page can have distinct, correct metadata
 * without a single hardcoded title/description string living in a
 * component.
 *
 * `index.html`'s static `<title>`/meta tags (the ones a crawler sees
 * before JS runs) still need to be hand-synced to `titleTemplate("")`/
 * `defaultDescription` below, or generated at build time - see the note
 * in `index.html`. `useSiteMeta` covers everything that matters once the
 * app has mounted, which is every real user and every JS-executing
 * crawler.
 */
export interface SiteConfig {
  /** Used as the `%s` in the title template, and for the `og:site_name` tag. */
  siteName: string;
  /** Builds a page's full <title>. Receives the page-specific title, or "" for the homepage. */
  titleTemplate: (pageTitle: string) => string;
  /** Fallback description used when a page doesn't provide its own. */
  defaultDescription: string;
  /** Absolute or root-relative URL for the default social share image (og:image). Leave empty to omit the tag. */
  defaultOgImage: string;
  /** BCP 47 locale, e.g. "en_PH", used for og:locale. */
  locale: string;
  /** Twitter/X handle including "@", or omit to skip twitter:site. */
  twitterHandle?: string;
}

export const site: SiteConfig = {
  siteName: branding.businessName,
  titleTemplate: (pageTitle) => buildTitle(branding.businessName, branding.tagline, pageTitle),
  defaultDescription: branding.businessDescription,
  defaultOgImage: "",
  locale: "en_PH",
  twitterHandle: undefined,
};

/**
 * Static per-route title/description overrides for routes that don't
 * compute their own (product pages build their title from the product
 * name instead - see `ProductDetail.tsx`).
 */
export const PAGE_META: Record<string, { title: string; description: string }> = {
  home: { title: "", description: branding.businessDescription },
  shop: { title: "Shop", description: `Browse the full catalog at ${branding.businessName}.` },
  about: { title: "About", description: `Learn more about ${branding.businessName}.` },
  contact: { title: "Contact", description: `Get in touch with ${branding.businessName}.` },
  cart: { title: "Your Cart", description: "Review the items in your cart." },
  checkout: { title: "Checkout", description: "Complete your order." },
  checkoutPaymentReturn: { title: "Confirming Payment", description: "Confirming your card payment." },
  orderConfirmation: { title: "Order Confirmed", description: "Your order has been placed." },
  wishlist: { title: "Your Wishlist", description: "Products you've saved for later." },
  login: { title: "Log In", description: `Log in to your ${branding.businessName} account.` },
  account: { title: "Your Account", description: "Manage your account and view order history." },
  admin: { title: "Admin Dashboard", description: "Manage your store." },
  adminStoreSettings: {
    title: "Store Settings",
    description: "Edit your business name, tagline, description, and contact info.",
  },
  adminTheme: {
    title: "Theme Editor",
    description: "Choose a template preset and customize its colors, fonts, radius, and styles.",
  },
  adminHomepage: {
    title: "Homepage Editor",
    description: "Choose a homepage layout and customize which sections show, in what order.",
  },
  adminProducts: {
    title: "Product Manager",
    description: "Add, edit, and remove products in your catalog.",
  },
  adminCategories: {
    title: "Category Manager",
    description: "Add, edit, and remove the categories used across your catalog and storefront.",
  },
  adminNavigation: {
    title: "Navigation Editor",
    description: "Add, remove, reorder, and rename the links shown in the header nav.",
  },
  adminFooter: {
    title: "Footer Editor",
    description: "Edit the footer's link columns, social links, and copyright line.",
  },
  adminPolicies: {
    title: "Policy Editor",
    description: "Edit the content shown on the Privacy, Terms, Shipping, and Returns policy pages.",
  },
  adminMedia: {
    title: "Media Library",
    description: "Upload and manage the images used across your store.",
  },
  adminCustomers: {
    title: "Customers",
    description: "View registered customers and their order history.",
  },
  adminCustomerDetail: {
    title: "Customer Detail",
    description: "View a customer's account details and order history.",
  },
  notFound: { title: "Page Not Found", description: "The page you're looking for doesn't exist." },
};
