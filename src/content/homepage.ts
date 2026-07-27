/**
 * All homepage marketing copy in one place. Components read from here
 * instead of hardcoding headlines/body copy, so the homepage can be
 * rewritten for a different business without touching any .tsx file.
 */

export interface HeroContent {
  eyebrow: string;
  /** Rendered as two lines; the second line is styled as the accent color. */
  headlineLine1: string;
  headlineLine2: string;
  subheadline: string;
  ctaPrimaryLabel: string;
  ctaPrimaryTo: string;
  ctaSecondaryLabel: string;
  ctaSecondaryTo: string;
}

export const HERO: HeroContent = {
  eyebrow: "Your business eyebrow text",
  headlineLine1: "Welcome to",
  headlineLine2: "Your Store",
  subheadline: "Describe your business here. This is where you tell customers what you sell and why they should shop with you.",
  ctaPrimaryLabel: "Shop the Collection",
  ctaPrimaryTo: "/shop",
  ctaSecondaryLabel: "Our Story",
  ctaSecondaryTo: "/about",
};

/**
 * Section heading copy (eyebrow/title/description) for every homepage
 * section that renders a `SectionHeading`, plus any other section-level
 * copy (button labels, unit labels) that used to be hardcoded directly
 * in the section's `.tsx` file. Components should always read section
 * headings from here rather than passing literal strings to
 * `<SectionHeading>` - that was the one gap Phase 8/8A's content
 * extraction missed (product/testimonial/FAQ *data* was config-driven,
 * but the headings introducing those sections were not).
 */
export interface CategoriesSectionContent {
  eyebrow: string;
  title: string;
  description: string;
  /** Suffix shown after each category's item count, e.g. "12 {itemsUnitLabel}". */
  itemsUnitLabel: string;
}

export const CATEGORIES_SECTION: CategoriesSectionContent = {
  eyebrow: "Browse by category",
  title: "Shop by category",
  description: "Explore the full catalog, organized to help you find what you're after.",
  itemsUnitLabel: "items",
};

export interface FeaturedSectionContent {
  eyebrow: string;
  title: string;
  viewAllLabel: string;
}

export const FEATURED_SECTION: FeaturedSectionContent = {
  eyebrow: "Just in",
  title: "Fresh arrivals",
  viewAllLabel: "View all",
};

export interface BestSellersSectionContent {
  eyebrow: string;
  title: string;
  description: string;
}

export const BEST_SELLERS_SECTION: BestSellersSectionContent = {
  eyebrow: "Most loved",
  title: "Customer favorites",
  description: "Ranked by what's actually sold the most.",
};

export interface NewArrivalsSectionContent {
  eyebrow: string;
  title: string;
  description: string;
}

export const NEW_ARRIVALS_SECTION: NewArrivalsSectionContent = {
  eyebrow: "Just landed",
  title: "New arrivals",
  description: "The newest additions to the catalog, freshly added.",
};

export interface CollectionsSectionContent {
  eyebrow: string;
  title: string;
  description: string;
}

export const COLLECTIONS_SECTION: CollectionsSectionContent = {
  eyebrow: "Curated for you",
  title: "Shop by collection",
  description: "Hand-picked product groupings to help you find what you need, faster.",
};

export interface TestimonialsSectionContent {
  eyebrow: string;
  title: string;
}

export const TESTIMONIALS_SECTION: TestimonialsSectionContent = {
  eyebrow: "Kind words",
  title: "What customers are saying",
};

export interface FaqSectionContent {
  eyebrow: string;
  title: string;
}

export const FAQ_SECTION: FaqSectionContent = {
  eyebrow: "Good to know",
  title: "Frequently asked questions",
};

export interface ContactTeaserContent {
  eyebrow: string;
  title: string;
  description: string;
  ctaLabel: string;
}

export const CONTACT_TEASER: ContactTeaserContent = {
  eyebrow: "Say hello",
  title: "Have a question before you order?",
  description: "Reach out any of these ways - we're happy to help.",
  ctaLabel: "Send us a message",
};

/** Optional site-wide announcement banner. Set `enabled: true` to show it. */
export interface Announcement {
  enabled: boolean;
  message: string;
  linkLabel?: string;
  linkTo?: string;
}

export const ANNOUNCEMENT: Announcement = {
  enabled: false,
  message: "",
};

export interface AboutPreviewContent {
  eyebrow: string;
  title: string;
  description: string;
  ctaLabel: string;
  ctaTo: string;
}

export const ABOUT_PREVIEW: AboutPreviewContent = {
  eyebrow: "Our story",
  title: "Tell your business story here",
  description: "Tell customers about your business. Share what makes it different, how it started, and what customers can expect when they shop with you.",
  ctaLabel: "Read our full story",
  ctaTo: "/about",
};

export interface NewsletterContent {
  title: string;
  description: string;
  successTitle: string;
  successDescription: string;
  ctaLabel: string;
}

export const NEWSLETTER: NewsletterContent = {
  title: "Subscribe to our newsletter",
  description: "Get updates on new products and offers. No spam, ever.",
  successTitle: "You're on the list!",
  successDescription: "Keep an eye on your inbox for our next update.",
  ctaLabel: "Subscribe",
};

export interface InstagramSectionContent {
  eyebrow: string;
  title: string;
  description: string;
}

export const INSTAGRAM_SECTION: InstagramSectionContent = {
  eyebrow: "@yourbusiness",
  title: "Follow along",
  description: "A peek behind the scenes - new arrivals, updates, and more.",
};

export interface Testimonial {
  id: string;
  name: string;
  location: string;
  rating: number;
  quote: string;
}

export const TESTIMONIALS: Testimonial[] = [
  {
    id: "t1",
    name: "Sample Customer A",
    location: "City, Country",
    rating: 5,
    quote: "Sample testimonial. Replace with a real quote from a customer once you have one.",
  },
  {
    id: "t2",
    name: "Sample Customer B",
    location: "City, Country",
    rating: 5,
    quote: "Sample testimonial. Replace with a real quote from a customer once you have one.",
  },
  {
    id: "t3",
    name: "Sample Customer C",
    location: "City, Country",
    rating: 4,
    quote: "Sample testimonial. Replace with a real quote from a customer once you have one.",
  },
];

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export const FAQS: FaqItem[] = [
  {
    id: "faq-shipping",
    question: "How long does shipping take?",
    answer: "Replace this with your store's actual shipping timeframes and any details customers should know before ordering.",
  },
  {
    id: "faq-custom",
    question: "Do you offer customization?",
    answer: "Replace this with your store's answer about customization, personalization, or special requests.",
  },
  {
    id: "faq-care",
    question: "How do I take care of my item?",
    answer: "Replace this with any care instructions relevant to your products.",
  },
  {
    id: "faq-returns",
    question: "What's your returns and exchange policy?",
    answer: "Replace this with your store's return and exchange policy.",
  },
  {
    id: "faq-payment",
    question: "What payment methods do you accept?",
    answer: "Replace this with the payment methods your store accepts.",
  },
];

export interface InstagramTile {
  id: string;
  caption: string;
  likes: number;
}

export const INSTAGRAM_TILES: InstagramTile[] = [
  { id: "ig1", caption: "Sample caption 1", likes: 214 },
  { id: "ig2", caption: "Sample caption 2", likes: 156 },
  { id: "ig3", caption: "Sample caption 3", likes: 189 },
  { id: "ig4", caption: "Sample caption 4", likes: 302 },
  { id: "ig5", caption: "Sample caption 5", likes: 141 },
  { id: "ig6", caption: "Sample caption 6", likes: 178 },
];
