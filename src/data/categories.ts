import type { Category } from "@/types/product";

/**
 * Editable category list. `icon` is a lucide-react icon name resolved by
 * the registry in `src/components/ui/CraftIcon.tsx` - swap it for any
 * icon in that registry (or add a new one) without touching component
 * code. `image` is optional; when set it's used instead of the
 * illustrated icon placeholder.
 */
export const CATEGORIES: Category[] = [
  {
    id: "category-a",
    slug: "category-a",
    label: "Category A",
    description: "Short description of this category",
    icon: "Gem",
    tone: "accent",
    itemCount: 6,
  },
  {
    id: "category-b",
    slug: "category-b",
    label: "Category B",
    description: "Short description of this category",
    icon: "Heart",
    tone: "primary",
    itemCount: 6,
  },
  {
    id: "category-c",
    slug: "category-c",
    label: "Category C",
    description: "Short description of this category",
    icon: "Flame",
    tone: "accent",
    itemCount: 6,
  },
  {
    id: "category-d",
    slug: "category-d",
    label: "Category D",
    description: "Short description of this category",
    icon: "Sticker",
    tone: "primary",
    itemCount: 6,
  },
];
