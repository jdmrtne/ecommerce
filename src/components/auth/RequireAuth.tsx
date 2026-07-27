import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { LoadingState } from "@/components/ui/Loading";

/**
 * Route guard for pages that need a logged-in user (currently just
 * /account). Redirects to /login, remembering where the person was headed
 * via router state so Login can send them back after a successful
 * login/signup.
 *
 * Phase 26: waits out `isInitializing` before judging `isAuthenticated` -
 * Supabase's session check is a real async call, and without this an
 * already-signed-in visitor hitting /account directly (a hard refresh)
 * would be judged "signed out" and redirected before the real session
 * had a chance to resolve.
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated, isInitializing } = useAuth();
  const location = useLocation();

  if (isInitializing) {
    return <LoadingState label="Checking your session..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return <>{children}</>;
}
