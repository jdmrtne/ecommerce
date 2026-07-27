import { storageKey } from "@/config/branding";

/**
 * Storage-layer concerns for the mock auth system (Phase 6), split out of
 * `AuthProvider.tsx` in Phase 15 so anything that needs to read the user
 * list - not just log in/out - can do so without depending on the
 * provider component itself. `AuthProvider` still owns all *session*
 * state (the currently signed-in user); this file only owns the
 * `localStorage`-backed user *records*.
 */

export type UserRole = "admin" | "customer";

export interface StoredUser {
  name: string;
  email: string;
  /**
   * Stored in plain text - this whole store is a client-only mock with no
   * real backend (same as Cart/Wishlist). There is no server to hash
   * against, so this is NOT representative of how real auth should be
   * built; it exists purely to demo the auth *flow* (forms, validation,
   * session persistence, protected routes - including the admin gate
   * added in Phase 15).
   */
  password: string;
  role: UserRole;
}

const USERS_KEY = storageKey("users");

/**
 * Phase 15 decision: gate `/admin` with a `role` field on the existing
 * mock user record (documented in `ROADMAP.md`/`MASTER_HANDOFF.md`)
 * rather than a separate admin-only auth system. Since there's no admin
 * signup UI yet (that's out of this phase's scope - it's just the
 * gated shell), a single admin account is seeded automatically the first
 * time the user store is read, so the admin area is reachable without
 * hand-editing `localStorage`. A later phase can add real admin-user
 * management; this seed is just enough to prove the gate works end to
 * end today.
 */
export const SEED_ADMIN_EMAIL = "admin@example.com";
export const SEED_ADMIN_PASSWORD = "admin12345";

function readRaw(): Record<string, StoredUser> {
  if (typeof window === "undefined") return {};
  try {
    const stored = window.localStorage.getItem(USERS_KEY);
    if (!stored) return {};
    const parsed = JSON.parse(stored) as unknown;
    return typeof parsed === "object" && parsed !== null ? (parsed as Record<string, StoredUser>) : {};
  } catch {
    return {};
  }
}

function writeRaw(users: Record<string, StoredUser>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

/** Adds the seed admin account if no admin-role user exists yet. Idempotent. */
function ensureSeedAdmin(users: Record<string, StoredUser>): Record<string, StoredUser> {
  if (Object.values(users).some((u) => u.role === "admin")) return users;
  const seeded: Record<string, StoredUser> = {
    ...users,
    [SEED_ADMIN_EMAIL]: {
      name: "Admin",
      email: SEED_ADMIN_EMAIL,
      password: SEED_ADMIN_PASSWORD,
      role: "admin",
    },
  };
  writeRaw(seeded);
  return seeded;
}

/** Reads every stored user record, seeding the default admin account on first read. */
export function readUsers(): Record<string, StoredUser> {
  return ensureSeedAdmin(readRaw());
}

/** Persists the full user record map. */
export function writeUsers(users: Record<string, StoredUser>): void {
  writeRaw(users);
}

/** Every registered user with password stripped - safe to use in admin UI. */
export function getRegisteredUsers(): Array<Omit<StoredUser, "password">> {
  return Object.values(readUsers()).map(({ password: _password, ...rest }) => rest);
}
