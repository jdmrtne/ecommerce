import { vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { ProductRow, ProfileRow } from "@/lib/api/types";
import { toProductRow } from "@/lib/api/types";
import { ALL_PRODUCTS } from "@/data/products";

/**
 * Phase 26 - Authentication (Backend-Integrated). A minimal in-memory
 * fake of Supabase Auth plus the `profiles` table, standing in for a
 * real Supabase project in every test that renders `<AuthProvider>`.
 * `src/test/setup.ts` mocks `@/lib/api/client`'s `supabase` singleton
 * with the `fakeSupabase` instance exported below - see that file for
 * why this has to be a global mock rather than a per-test-file one.
 *
 * This is a different shape of fake than `mockSupabaseClient.ts`'s
 * `chainableResult()`/`createMockSupabaseClient()`: those return a
 * fixed canned response regardless of what's queried, which is enough
 * for `lib/api/*.test.ts` (each test injects its own client and only
 * cares about one call). `AuthProvider` drives real UI flows across
 * dozens of unrelated component tests (anything using
 * `renderWithProviders`), so this fake actually has to behave like a
 * backend across a whole journey - signup, a session that persists
 * across a second `<AuthProvider>` mount (simulating a page reload),
 * login, logout - not just answer one call in isolation.
 *
 * Phase 27 - Products (Backend-Integrated) adds a `products` table to
 * this same fake, seeded from `data/products.ts`'s `ALL_PRODUCTS` (the
 * same catalog `supabase/seed_products.sql` seeds a real project with),
 * for the same reason: `Shop`/`ProductDetail`/the homepage product
 * sections/`ProductManager` all now call `lib/api/products.ts` against
 * the default `supabase` singleton, which every test file gets this fake
 * for whether it asked for one or not.
 */

interface FakeAccount {
  id: string;
  email: string;
  password: string;
}

type FakeSession = { user: { id: string; email: string } } | null;
type AuthListener = (event: string, session: FakeSession) => void;

export interface FakeAuthClient extends SupabaseClient {
  /** Registers an account + profile without signing in - for tests that seed a user for a later login() call. */
  __seedProfile(profile: ProfileRow, password: string): void;
  /** Registers (if needed) and signs in as this profile immediately - for tests that need an already-authenticated render. */
  __signInAs(profile: ProfileRow): void;
  /** Clears every account/profile/session/listener. Called automatically between tests by `src/test/setup.ts`. */
  __reset(): void;
}

function seedProducts(): Map<string, ProductRow> {
  return new Map(ALL_PRODUCTS.map((p) => [p.id, toProductRow(p)]));
}

export function createFakeAuthClient(): FakeAuthClient {
  let accounts = new Map<string, FakeAccount>(); // key: lowercase email
  let profiles = new Map<string, ProfileRow>(); // key: id
  let products = seedProducts();
  let settings = new Map<string, unknown>(); // key: site_settings row key (theme/store/homepage)
  let session: FakeSession = null;
  let idSeq = 1;
  let listeners = new Set<AuthListener>();

  function notify(event: string) {
    for (const listener of listeners) listener(event, session);
  }

  function productsTable() {
    return {
      select: () => ({
        order: (field: string, opts?: { ascending?: boolean }) => {
          const rows = [...products.values()].sort((a, b) => {
            const av = String((a as unknown as Record<string, unknown>)[field]);
            const bv = String((b as unknown as Record<string, unknown>)[field]);
            return opts?.ascending === false ? bv.localeCompare(av) : av.localeCompare(bv);
          });
          return Promise.resolve({ data: rows, error: null });
        },
        eq: (field: string, value: string) => ({
          maybeSingle: () => {
            const row =
              [...products.values()].find((p) => (p as unknown as Record<string, unknown>)[field] === value) ?? null;
            return Promise.resolve({ data: row, error: null });
          },
        }),
      }),
      upsert: (row: ProductRow) => {
        products.set(row.id, row);
        return {
          select: () => ({
            single: () => Promise.resolve({ data: row, error: null }),
          }),
        };
      },
      delete: () => ({
        eq: (field: string, value: string) => {
          const target = [...products.values()].find((p) => (p as unknown as Record<string, unknown>)[field] === value);
          if (target) products.delete(target.id);
          return Promise.resolve({ data: null, error: null });
        },
      }),
    };
  }

  function profilesTable() {
    return {
      insert: (row: ProfileRow) => {
        profiles.set(row.id, row);
        return Promise.resolve({ data: row, error: null });
      },
      select: () => {
        let eqField: string | undefined;
        let eqValue: string | undefined;
        const chain = {
          eq: (field: string, value: string) => {
            eqField = field;
            eqValue = value;
            return chain;
          },
          maybeSingle: () => {
            const row =
              [...profiles.values()].find((p) => (p as unknown as Record<string, unknown>)[eqField ?? ""] === eqValue) ??
              null;
            return Promise.resolve({ data: row, error: null });
          },
          order: (field: string) => {
            const rows = [...profiles.values()].sort((a, b) =>
              String((a as unknown as Record<string, unknown>)[field]).localeCompare(
                String((b as unknown as Record<string, unknown>)[field]),
              ),
            );
            return Promise.resolve({ data: rows, error: null });
          },
        };
        return chain;
      },
    };
  }

  function settingsTable() {
    return {
      select: () => ({
        eq: (field: string, value: string) => ({
          maybeSingle: () => {
            const row = field === "key" && settings.has(value) ? { key: value, value: settings.get(value) } : null;
            return Promise.resolve({ data: row, error: null });
          },
        }),
      }),
      upsert: (row: { key: string; value: unknown }) => {
        settings.set(row.key, row.value);
        return Promise.resolve({ data: row, error: null });
      },
    };
  }

  const client = {
    from: (table: string) => {
      if (table === "profiles") return profilesTable();
      if (table === "products") return productsTable();
      if (table === "site_settings") return settingsTable();
      throw new Error(`FakeAuthClient: unsupported table "${table}"`);
    },
    auth: {
      signUp: vi.fn(async ({ email, password }: { email: string; password: string }) => {
        const key = email.toLowerCase();
        if (accounts.has(key)) {
          return { data: { user: null, session: null }, error: { message: "User already registered" } };
        }
        const id = `fake-user-${idSeq++}`;
        accounts.set(key, { id, email: key, password });
        session = { user: { id, email: key } };
        notify("SIGNED_IN");
        return { data: { user: { id, email: key }, session }, error: null };
      }),
      signInWithPassword: vi.fn(async ({ email, password }: { email: string; password: string }) => {
        const key = email.toLowerCase();
        const account = accounts.get(key);
        if (!account || account.password !== password) {
          return { data: { user: null, session: null }, error: { message: "Invalid login credentials" } };
        }
        session = { user: { id: account.id, email: key } };
        notify("SIGNED_IN");
        return { data: { user: { id: account.id, email: key }, session }, error: null };
      }),
      signOut: vi.fn(async () => {
        session = null;
        notify("SIGNED_OUT");
        return { error: null };
      }),
      getUser: vi.fn(async () => ({ data: { user: session?.user ?? null }, error: null })),
      onAuthStateChange: vi.fn((callback: AuthListener) => {
        listeners.add(callback);
        return { data: { subscription: { unsubscribe: () => listeners.delete(callback) } } };
      }),
    },
    __seedProfile(profile: ProfileRow, password: string) {
      accounts.set(profile.email.toLowerCase(), { id: profile.id, email: profile.email.toLowerCase(), password });
      profiles.set(profile.id, profile);
    },
    __signInAs(profile: ProfileRow) {
      const key = profile.email.toLowerCase();
      if (!profiles.has(profile.id)) profiles.set(profile.id, profile);
      if (!accounts.has(key)) accounts.set(key, { id: profile.id, email: key, password: "unused" });
      session = { user: { id: profile.id, email: key } };
    },
    __reset() {
      accounts = new Map();
      profiles = new Map();
      products = seedProducts();
      settings = new Map();
      session = null;
      listeners = new Set();
    },
  };

  return client as unknown as FakeAuthClient;
}

/**
 * Shared singleton - `src/test/setup.ts` injects this as the mocked
 * `@/lib/api/client`'s `supabase` export for the whole test run, so any
 * test file can `import { fakeSupabase } from "@/test/fakeSupabaseAuth"`
 * to seed accounts or assert on `.auth`/`.from` calls, and be sure it's
 * the exact same instance `<AuthProvider>` is talking to.
 */
export const fakeSupabase = createFakeAuthClient();
