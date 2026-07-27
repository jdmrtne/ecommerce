import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { AuthContext } from "@/context/AuthContext";
import type { AuthUser } from "@/context/AuthContext";
import { supabase } from "@/lib/api/client";
import { apiGetCurrentUser, apiLogin, apiLogout, apiSignup } from "@/lib/api/auth";

/**
 * App-wide real auth (Phase 26), mounted once in App.tsx alongside
 * Cart/WishlistProvider. Replaces the Phase 6 mock (a `localStorage`
 * user table with plaintext passwords - see Known Issues in
 * `MASTER_HANDOFF.md` pre-Phase-26) with Supabase Auth via Phase 25's
 * `lib/api/auth.ts` layer. `login`/`signup`/`logout` keep the exact
 * same call shapes as the mock - `useAuth()` consumers (Login.tsx,
 * Account.tsx, Navbar.tsx, AdminLayout.tsx, RequireAuth/RequireAdmin)
 * needed no changes beyond `logout` becoming async (see AuthContext.ts).
 *
 * Session persistence: this is a pure client-side SPA with no backend
 * of its own (it talks to Supabase directly), so there's no server to
 * own an httpOnly cookie - the more secure option the project's own
 * rules would otherwise prefer. Supabase's JS client persists the
 * session itself (in `localStorage`, under its own key - not this
 * app's old `<prefix>-session` key) and refreshes it automatically;
 * `onAuthStateChange` (subscribed below) is how this provider learns
 * about a restored/refreshed/expired session without polling.
 *
 * Initial state is `null`/signed-out rather than gating the whole app
 * on the async session check: unlike the mock's synchronous
 * `localStorage` read, confirming a Supabase session is a real
 * (if usually fast) async call, and blocking every route behind it
 * would mean every already-authenticated page load flashes a loading
 * screen even on pages that don't care about auth at all. Instead,
 * `isInitializing` is exposed on the context for the two consumers
 * that *do* need to wait for a real answer before acting -
 * `RequireAuth`/`RequireAdmin` - so a route guard never judges
 * `isAuthenticated` before it's had a chance to become true for an
 * already-signed-in visitor loading a protected route directly.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    let isMounted = true;

    apiGetCurrentUser()
      .then((current) => {
        if (isMounted) setUser(current);
      })
      .catch(() => {
        if (isMounted) setUser(null);
      })
      .finally(() => {
        if (isMounted) setIsInitializing(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;
      // login()/signup() below already set `user` themselves once their
      // own work (including, for signup, inserting the new profile row)
      // is complete - reacting to a SIGNED_IN event here too would
      // re-fetch the profile mid-flight, before a fresh signup's row
      // necessarily exists yet, and could clobber the correct value
      // with a false "no profile found" null. SIGNED_OUT (a session
      // revoked, or expired, e.g. from another tab) is the one case
      // this provider doesn't already know about some other way, so
      // it's the only event handled here.
      if (event === "SIGNED_OUT" || !session) {
        setUser(null);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const loggedIn = await apiLogin(email, password);
    setUser(loggedIn);
  }, []);

  const signup = useCallback(async (name: string, email: string, password: string) => {
    const created = await apiSignup(name, email, password);
    setUser(created);
  }, []);

  const logout = useCallback(async () => {
    await apiLogout();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, isAuthenticated: user !== null, isInitializing, login, signup, logout }),
    [user, isInitializing, login, signup, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
