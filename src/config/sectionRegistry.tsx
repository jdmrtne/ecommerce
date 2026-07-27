import type { ComponentType } from "react";
import { Hero } from "@/components/home/Hero";
import { Categories } from "@/components/home/Categories";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { BestSellers } from "@/components/home/BestSellers";
import { NewArrivals } from "@/components/home/NewArrivals";
import { Collections } from "@/components/home/Collections";
import { AboutBrand } from "@/components/home/AboutBrand";
import { Testimonials } from "@/components/home/Testimonials";
import { InstagramGallery } from "@/components/home/InstagramGallery";
import { Newsletter } from "@/components/home/Newsletter";
import { FAQ } from "@/components/home/FAQ";
import { ContactTeaser } from "@/components/home/ContactTeaser";
import { AboutIntro } from "@/components/about/AboutIntro";
import { AboutStorySection } from "@/components/about/AboutStorySection";
import { AboutProcess } from "@/components/about/AboutProcess";
import { AboutValuesSection } from "@/components/about/AboutValuesSection";
import { AboutCtaSection } from "@/components/about/AboutCtaSection";
import { ContactIntro } from "@/components/contact/ContactIntro";
import { ContactDetails } from "@/components/contact/ContactDetails";
import type { SectionOverrideProps } from "@/types/layout";

/**
 * Every section key the page builder can render, across every page.
 * `Home.tsx`, `About.tsx`, and `Contact.tsx` are all thin rendering
 * engines: they read a `PageLayout` from `config/layouts/`, look each
 * enabled section's key up here, and render the matching component with
 * that instance's `title`/`subtitle`/`settings` overrides.
 *
 * This is the ONE place a brand-new section type needs registering -
 * after that, any page's layout config can opt into it by key.
 */
export const SECTION_REGISTRY = {
  // Homepage sections
  hero: Hero,
  categories: Categories,
  featured: FeaturedProducts,
  bestSellers: BestSellers,
  newArrivals: NewArrivals,
  collections: Collections,
  about: AboutBrand,
  testimonials: Testimonials,
  instagram: InstagramGallery,
  newsletter: Newsletter,
  faq: FAQ,
  contact: ContactTeaser,

  // About page sections
  aboutIntro: AboutIntro,
  aboutStory: AboutStorySection,
  aboutProcess: AboutProcess,
  aboutValues: AboutValuesSection,
  aboutCta: AboutCtaSection,

  // Contact page sections
  contactIntro: ContactIntro,
  contactDetails: ContactDetails,
} satisfies Record<string, ComponentType<SectionOverrideProps>>;

export type SectionKey = keyof typeof SECTION_REGISTRY;
