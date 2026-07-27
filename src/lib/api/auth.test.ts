import { describe, expect, it, vi } from "vitest";
import { apiGetCurrentUser, apiGetCustomers, apiLogin, apiLogout, apiSignup } from "@/lib/api/auth";
import { chainableResult, createMockSupabaseClient } from "@/test/mockSupabaseClient";
import type { ProfileRow } from "@/lib/api/types";
import type { AuthUser } from "@/context/AuthContext";

const PROFILE_ROW: ProfileRow = { id: "user-1", email: "jude@example.com", name: "Jude", role: "customer" };
const AUTH_USER: AuthUser = { name: "Jude", email: "jude@example.com", role: "customer" };

describe("lib/api/auth", () => {
  it("apiLogin signs in and returns the mapped profile", async () => {
    const chain = chainableResult({ data: PROFILE_ROW, error: null });
    const client = createMockSupabaseClient(chain);
    client.auth.signInWithPassword = vi.fn(async () => ({
      data: { user: { id: "user-1", email: "jude@example.com" }, session: {} },
      error: null,
    })) as unknown as typeof client.auth.signInWithPassword;

    const user = await apiLogin("jude@example.com", "secret", client);

    expect(client.auth.signInWithPassword).toHaveBeenCalledWith({ email: "jude@example.com", password: "secret" });
    expect(chain.eq).toHaveBeenCalledWith("id", "user-1");
    expect(user).toEqual(AUTH_USER);
  });

  it("apiLogin throws Supabase's error message on invalid credentials", async () => {
    const client = createMockSupabaseClient(chainableResult({ data: null, error: null }));
    client.auth.signInWithPassword = vi.fn(async () => ({
      data: { user: null, session: null },
      error: { message: "Invalid login credentials" },
    })) as unknown as typeof client.auth.signInWithPassword;

    await expect(apiLogin("jude@example.com", "wrong", client)).rejects.toThrow("Invalid login credentials");
  });

  it("apiLogin throws when signed in but no profile row exists", async () => {
    const client = createMockSupabaseClient(chainableResult({ data: null, error: null }));
    client.auth.signInWithPassword = vi.fn(async () => ({
      data: { user: { id: "user-1", email: "jude@example.com" }, session: {} },
      error: null,
    })) as unknown as typeof client.auth.signInWithPassword;

    await expect(apiLogin("jude@example.com", "secret", client)).rejects.toThrow("no profile was found");
  });

  it("apiSignup creates the auth user, inserts a customer profile, and returns it", async () => {
    const chain = chainableResult({ data: null, error: null });
    const client = createMockSupabaseClient(chain);
    client.auth.signUp = vi.fn(async () => ({
      data: { user: { id: "user-1", email: "jude@example.com" }, session: {} },
      error: null,
    })) as unknown as typeof client.auth.signUp;

    const user = await apiSignup("Jude", "Jude@Example.com", "secret123", client);

    expect(chain.insert).toHaveBeenCalledWith({ id: "user-1", email: "jude@example.com", name: "Jude", role: "customer" });
    expect(user).toEqual(AUTH_USER);
  });

  it("apiSignup throws Supabase's error message when the email is already registered", async () => {
    const client = createMockSupabaseClient(chainableResult({ data: null, error: null }));
    client.auth.signUp = vi.fn(async () => ({
      data: { user: null, session: null },
      error: { message: "User already registered" },
    })) as unknown as typeof client.auth.signUp;

    await expect(apiSignup("Jude", "jude@example.com", "secret123", client)).rejects.toThrow("User already registered");
  });

  it("apiLogout signs out and throws on failure", async () => {
    const okClient = createMockSupabaseClient(chainableResult({ data: null, error: null }));
    await expect(apiLogout(okClient)).resolves.toBeUndefined();

    const failClient = createMockSupabaseClient(chainableResult({ data: null, error: null }));
    failClient.auth.signOut = vi.fn(async () => ({ error: { message: "network error" } })) as unknown as typeof failClient.auth.signOut;
    await expect(apiLogout(failClient)).rejects.toThrow("network error");
  });

  it("apiGetCurrentUser returns null when nobody's signed in", async () => {
    const client = createMockSupabaseClient(chainableResult({ data: null, error: null }));
    expect(await apiGetCurrentUser(client)).toBeNull();
  });

  it("apiGetCurrentUser returns the mapped profile for the signed-in user", async () => {
    const chain = chainableResult({ data: PROFILE_ROW, error: null });
    const client = createMockSupabaseClient(chain);
    client.auth.getUser = vi.fn(async () => ({
      data: { user: { id: "user-1", email: "jude@example.com" } },
      error: null,
    })) as unknown as typeof client.auth.getUser;

    expect(await apiGetCurrentUser(client)).toEqual(AUTH_USER);
  });

  it("apiGetCustomers maps every profile row, ordered by name", async () => {
    const chain = chainableResult({ data: [PROFILE_ROW], error: null });
    const client = createMockSupabaseClient(chain);

    const customers = await apiGetCustomers(client);

    expect(client.from).toHaveBeenCalledWith("profiles");
    expect(chain.order).toHaveBeenCalledWith("name", { ascending: true });
    expect(customers).toEqual([AUTH_USER]);
  });
});
