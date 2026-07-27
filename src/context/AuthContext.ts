import { createContext, useContext } from "react";
import type { UserRole } from "@/lib/userStore";

export interface AuthUser {
  name: string;
  email: string;
  /** Phase 15: gates `/admin` (see `RequireAdmin`). Every account defaults to "customer". */
  role: UserRole;
}

export interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  /**
   * Phase 26: true until the initial Supabase session check resolves.
   * `AuthProvider` doesn't block the whole app tree on this (most pages
   * don't care about auth state at all) - `RequireAuth`/`RequireAdmin`
   * are the two consumers that do, so a route guard never judges
   * `isAuthenticated` before it's had a chance to become true for an
   * already-signed-in visitor loading a protected route directly.
   */
  isInitializing: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  /**
   * Phase 26: async (it calls Supabase's `signOut()`, a real network
   * call), unlike the Phase 6 mock's synchronous version. Every caller
   * must `await` this before doing a hard `window.location.href`
   * navigation afterward, or the sign-out request can be aborted by the
   * page unload before it reaches Supabase.
   */
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

/** Access auth state/actions. Must be called under <AuthProvider> (mounted in App.tsx). */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
