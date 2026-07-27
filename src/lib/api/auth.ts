import type { SupabaseClient } from "@supabase/supabase-js";
import type { AuthUser } from "@/context/AuthContext";
import { supabase } from "@/lib/api/client";
import { mapProfileRow } from "@/lib/api/types";
import type { ProfileRow } from "@/lib/api/types";

/**
 * Phase 25 - Backend Integration. Same `login`/`signup`/`logout` shapes
 * as `AuthProvider.tsx`'s mock implementation (see its doc comment:
 * "swapping in real authentication later means replacing the bodies of
 * login/signup/logout below with real API calls; the shape of useAuth()
 * doesn't need to change"), backed by Supabase Auth instead of a
 * `localStorage` user table. A `profiles` row (name + role, since
 * Supabase's own `auth.users` only knows email/password) is read/written
 * alongside every auth call - see `supabase/schema.sql`.
 *
 * Not wired into `AuthProvider` yet - this phase is plumbing only.
 */

async function fetchProfile(client: SupabaseClient, userId: string): Promise<ProfileRow | null> {
  const { data, error } = await client.from("profiles").select("*").eq("id", userId).maybeSingle();
  if (error) throw new Error(error.message);
  return (data as ProfileRow | null) ?? null;
}

export async function apiLogin(email: string, password: string, client: SupabaseClient = supabase): Promise<AuthUser> {
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);
  if (!data.user) throw new Error("Login succeeded but no user was returned.");

  const profile = await fetchProfile(client, data.user.id);
  if (!profile) throw new Error("Signed in, but no profile was found for this account.");
  return mapProfileRow(profile);
}

export async function apiSignup(
  name: string,
  email: string,
  password: string,
  client: SupabaseClient = supabase,
): Promise<AuthUser> {
  const { data, error } = await client.auth.signUp({ email, password });
  if (error) throw new Error(error.message);
  if (!data.user) throw new Error("Signup succeeded but no user was returned.");

  // Every self-signup account is a customer - same rule as the mock
  // (`AuthProvider.tsx`): there's no signup-time role picker.
  const profile: ProfileRow = { id: data.user.id, email: email.toLowerCase(), name, role: "customer" };
  const { error: profileError } = await client.from("profiles").insert(profile);
  if (profileError) throw new Error(profileError.message);

  return mapProfileRow(profile);
}

export async function apiLogout(client: SupabaseClient = supabase): Promise<void> {
  const { error } = await client.auth.signOut();
  if (error) throw new Error(error.message);
}

export async function apiGetCurrentUser(client: SupabaseClient = supabase): Promise<AuthUser | null> {
  const {
    data: { user },
    error,
  } = await client.auth.getUser();
  if (error) throw new Error(error.message);
  if (!user) return null;

  const profile = await fetchProfile(client, user.id);
  return profile ? mapProfileRow(profile) : null;
}

/** Mirrors `userStore.ts`'s `getRegisteredUsers()` - every account, for an admin customer list. No passwords: Supabase Auth never exposes them, and `profiles` never stores one. */
export async function apiGetCustomers(client: SupabaseClient = supabase): Promise<AuthUser[]> {
  const { data, error } = await client.from("profiles").select("*").order("name", { ascending: true });
  if (error) throw new Error(error.message);
  return ((data ?? []) as ProfileRow[]).map(mapProfileRow);
}
