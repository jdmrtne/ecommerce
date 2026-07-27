export interface AboutHero {
  eyebrow: string;
  title: string;
  body: string;
}

export const ABOUT_HERO: AboutHero = {
  eyebrow: "About My Business",
  title: "Tell your business story here",
  body: "Tell customers about your business. This is where you explain how it started, what you make or sell, and what customers can expect.",
};

export interface AboutStory {
  eyebrow: string;
  title: string;
  body: string;
}

export const ABOUT_STORY: AboutStory = {
  eyebrow: "Our story",
  title: "How it all started",
  body: "Replace this with your business's origin story - how it began, what problem it solves, and what's changed (or stayed the same) along the way.",
};

export interface AboutSectionHeading {
  eyebrow: string;
  title: string;
}

export const PROCESS_SECTION: AboutSectionHeading = {
  eyebrow: "Behind the scenes",
  title: "How it comes together",
};

export const VALUES_SECTION: AboutSectionHeading = {
  eyebrow: "What we care about",
  title: "Our values",
};

export interface ProcessStep {
  /** Name of a lucide-react icon, resolved via the icon registry in CraftIcon.tsx. */
  icon: "Sparkles" | "Gem" | "PackageCheck" | "Truck";
  title: string;
  description: string;
}

export const PROCESS_STEPS: ProcessStep[] = [
  {
    icon: "Sparkles",
    title: "Step one",
    description: "Describe the first step of how you design, source, or prepare your products.",
  },
  {
    icon: "Gem",
    title: "Step two",
    description: "Describe how your products are made or selected.",
  },
  {
    icon: "PackageCheck",
    title: "Step three",
    description: "Describe your quality-check process before an order ships.",
  },
  {
    icon: "Truck",
    title: "Step four",
    description: "Describe how orders are packed and shipped.",
  },
];

export interface AboutValue {
  title: string;
  description: string;
}

export const ABOUT_VALUES: AboutValue[] = [
  { title: "Value one", description: "Describe a value that matters to your business." },
  { title: "Value two", description: "Describe another value that matters to your business." },
  { title: "Value three", description: "Describe another value that matters to your business." },
];

export const ABOUT_CTA = {
  title: "Ready to find your piece?",
  buttonLabel: "Shop all products",
};
