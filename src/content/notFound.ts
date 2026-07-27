/** Copy shown on the 404 page (`src/pages/NotFound.tsx`). */
export interface NotFoundContent {
  code: string;
  title: string;
  description: string;
  ctaLabel: string;
  ctaTo: string;
}

export const NOT_FOUND: NotFoundContent = {
  code: "404",
  title: "Page not found",
  description: "We couldn't find what you were looking for. It may have been moved or doesn't exist.",
  ctaLabel: "Back to home",
  ctaTo: "/",
};
