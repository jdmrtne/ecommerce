export interface NavLink {
  label: string;
  to: string;
}

/** Primary nav, shown in the desktop nav bar and the mobile menu. */
export const MAIN_NAV: NavLink[] = [
  { label: "Shop", to: "/shop" },
  { label: "About", to: "/about" },
  { label: "Contact", to: "/contact" },
];

/** Footer link columns. Column titles are also configurable. */
export const FOOTER_LINK_GROUPS: { title: string; links: NavLink[] }[] = [
  {
    title: "Shop",
    links: [
      { label: "All Products", to: "/shop" },
      { label: "Best Sellers", to: "/shop?sort=best-selling" },
      { label: "New Arrivals", to: "/shop?sort=newest" },
    ],
  },
  {
    title: "Help",
    links: [
      { label: "Contact Us", to: "/contact" },
      { label: "FAQ", to: "/faq" },
      { label: "Shipping Info", to: "/policies/shipping" },
      { label: "Returns & Exchanges", to: "/policies/returns" },
      { label: "Privacy Policy", to: "/policies/privacy" },
      { label: "Terms of Service", to: "/policies/terms" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", to: "/about" },
      { label: "Our Story", to: "/about#story" },
    ],
  },
];

/** Extra quick links, e.g. for a mobile menu utility row (none by default). */
export const QUICK_LINKS: NavLink[] = [];
