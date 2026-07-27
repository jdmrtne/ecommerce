import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Squiggle } from "@/components/ui/Squiggle";
import { NOT_FOUND } from "@/content/notFound";
import { PAGE_META } from "@/config/site";
import { useSiteMeta } from "@/hooks/useSiteMeta";

/**
 * Presentational 404 panel, split out (Phase 13) from `NotFound` so
 * `pages/Policy.tsx` can render the same markup for an unknown policy
 * slug without duplicating it or calling `useSiteMeta` a second time
 * (Policy already sets its own title/description before this renders).
 */
export function NotFoundPanel() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-6 py-28 text-center">
      <h1 className="font-display text-6xl text-denim">{NOT_FOUND.code}</h1>
      <Squiggle className="my-4" />
      <h2 className="mb-2 text-xl font-semibold text-ink">{NOT_FOUND.title}</h2>
      <p className="mb-6 text-ink-soft">{NOT_FOUND.description}</p>
      <Link to={NOT_FOUND.ctaTo}>
        <Button>{NOT_FOUND.ctaLabel}</Button>
      </Link>
    </div>
  );
}

export function NotFound() {
  useSiteMeta(PAGE_META.notFound);
  return <NotFoundPanel />;
}
