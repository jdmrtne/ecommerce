import { describe, expect, it } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { AuthProvider } from "@/context/AuthProvider";
import { useAuth } from "@/context/AuthContext";
import { fakeSupabase } from "@/test/fakeSupabaseAuth";
import type { ProfileRow } from "@/lib/api/types";

const ADMIN_PROFILE: ProfileRow = { id: "seed-admin", email: "boss@example.com", name: "Boss", role: "admin" };

function setup() {
  return renderHook(() => useAuth(), { wrapper: AuthProvider });
}

describe("AuthProvider", () => {
  it("starts signed out, then settles the initial session check with nobody signed in", async () => {
    const { result } = setup();
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.isInitializing).toBe(true);

    await waitFor(() => expect(result.current.isInitializing).toBe(false));
    expect(result.current.isAuthenticated).toBe(false);
  });

  it("signup creates a session and returns the new profile", async () => {
    const { result } = setup();
    await act(async () => {
      await result.current.signup("Jude", "jude@example.com", "secret123");
    });

    expect(result.current.user).toEqual({ name: "Jude", email: "jude@example.com", role: "customer" });
    expect(result.current.isAuthenticated).toBe(true);
  });

  it("signup rejects a duplicate (case-insensitive) email", async () => {
    const { result } = setup();
    await act(async () => {
      await result.current.signup("Jude", "jude@example.com", "secret123");
    });

    await expect(
      act(async () => {
        await result.current.signup("Someone Else", "Jude@Example.com", "different1");
      }),
    ).rejects.toThrow("User already registered");
  });

  it("login succeeds with correct credentials after signup", async () => {
    const { result } = setup();
    await act(async () => {
      await result.current.signup("Jude", "jude@example.com", "secret123");
    });
    await act(async () => {
      await result.current.logout();
    });
    expect(result.current.isAuthenticated).toBe(false);

    await act(async () => {
      await result.current.login("jude@example.com", "secret123");
    });
    expect(result.current.isAuthenticated).toBe(true);
  });

  it("login rejects an unknown email", async () => {
    const { result } = setup();
    await expect(
      act(async () => {
        await result.current.login("nobody@example.com", "whatever1");
      }),
    ).rejects.toThrow("Invalid login credentials");
    expect(result.current.isAuthenticated).toBe(false);
  });

  it("login rejects a wrong password for a known email", async () => {
    const { result } = setup();
    await act(async () => {
      await result.current.signup("Jude", "jude@example.com", "secret123");
    });
    await act(async () => {
      await result.current.logout();
    });

    await expect(
      act(async () => {
        await result.current.login("jude@example.com", "wrong-password");
      }),
    ).rejects.toThrow("Invalid login credentials");
  });

  it("logout clears the user", async () => {
    const { result } = setup();
    await act(async () => {
      await result.current.signup("Jude", "jude@example.com", "secret123");
    });

    await act(async () => {
      await result.current.logout();
    });
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it("restores the session from Supabase on next mount", async () => {
    const first = setup();
    await act(async () => {
      await first.result.current.signup("Jude", "jude@example.com", "secret123");
    });

    // A fresh <AuthProvider> mount (e.g. a page reload) reads the same
    // still-persisted Supabase session back via apiGetCurrentUser(),
    // the same way a real reload would restore it from Supabase's own
    // localStorage-backed session, not this app's code.
    const second = setup();
    await waitFor(() =>
      expect(second.result.current.user).toEqual({ name: "Jude", email: "jude@example.com", role: "customer" }),
    );
  });

  it("signup accounts default to the customer role, never admin", async () => {
    const { result } = setup();
    await act(async () => {
      await result.current.signup("Jude", "jude@example.com", "secret123");
    });
    expect(result.current.user?.role).toBe("customer");
  });

  it("an account seeded with the admin role can log in as admin", async () => {
    fakeSupabase.__seedProfile(ADMIN_PROFILE, "admin12345");
    const { result } = setup();

    await act(async () => {
      await result.current.login("boss@example.com", "admin12345");
    });
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user?.role).toBe("admin");
  });
});
