import type { ReactNode } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { ShieldAlert } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { Squiggle } from "@/components/ui/Squiggle";
import { LoadingState } from "@/components/ui/Loading";

/**
 * Route guard for the entire `/admin` tree (Phase 15). Two distinct cases:
 *
 * 1. Nobody's signed in -> redirect to `/login`, same as `RequireAuth`,
 *    remembering `/admin` so Login can send them back after signing in.
 * 2. Someone's signed in but their account isn't an admin -> render an
 *    access-denied panel in place rather than redirecting, so it's clear
 *    *why* they can't get in (as opposed to silently bouncing them to
 *    `/login` as if they weren't signed in at all).
 *
 * Phase 26: waits out `isInitializing` first, same reasoning as
 * `RequireAuth` - an admin hitting /admin directly on a hard refresh
 * shouldn't be judged signed-out (or non-admin) before Supabase's async
 * session check has actually resolved.
 */
export function RequireAdmin({ children }: { children: ReactNode }) {
  const { isAuthenticated, isInitializing, user } = useAuth();
  const location = useLocation();

  if (isInitializing) {
    return <LoadingState label="Checking your session..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (user?.role !== "admin") {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center px-6 py-28 text-center">
        <ShieldAlert size={40} strokeWidth={1.5} className="text-ink-soft" />
        <h1 className="mt-4 text-xl font-semibold text-ink">Admin access required</h1>
        <p className="mt-2 text-ink-soft">
          Your account doesn&apos;t have permission to view the admin area.
        </p>
        <Squiggle className="my-4" />
        <Link to="/">
          <Button>Back to store</Button>
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
