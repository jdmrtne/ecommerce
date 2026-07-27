import { vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * A minimal fake of Supabase's chainable query builder for `lib/api/*`
 * tests. Every table-query call in this app's API layer follows one of a
 * few shapes - `.select().order()`, `.select().eq().maybeSingle()`,
 * `.upsert().select().single()`, `.insert(...)`, `.delete().eq(...)` -
 * and every one of those chains ultimately resolves to `{ data, error }`.
 * Supabase's real builder is itself "thenable" (awaiting it without
 * calling `.single()`/`.maybeSingle()` still resolves to `{data, error}`),
 * so this fake is too: every chain method returns the same object, and
 * that object also implements `.then()` so `await` works at any point in
 * the chain, not just after a terminal method.
 */
export function chainableResult(result: { data: unknown; error: { message: string } | null }) {
  const chain: Record<string, unknown> = {
    select: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    order: vi.fn(() => chain),
    upsert: vi.fn(() => chain),
    insert: vi.fn(() => chain),
    delete: vi.fn(() => chain),
    maybeSingle: vi.fn(() => Promise.resolve(result)),
    single: vi.fn(() => Promise.resolve(result)),
    then: (resolve: (value: typeof result) => unknown) => resolve(result),
  };
  return chain;
}

/**
 * A fake `SupabaseClient` whose `.from(table)` always returns the given
 * chainable result, and whose `.auth` methods are individually
 * overridable `vi.fn()`s (default: resolve with no user/session, so an
 * auth test only has to override what it's actually exercising).
 */
export function createMockSupabaseClient(fromResult: ReturnType<typeof chainableResult>) {
  const client = {
    from: vi.fn(() => fromResult),
    auth: {
      signInWithPassword: vi.fn(async () => ({ data: { user: null, session: null }, error: null })),
      signUp: vi.fn(async () => ({ data: { user: null, session: null }, error: null })),
      signOut: vi.fn(async () => ({ error: null })),
      getUser: vi.fn(async () => ({ data: { user: null }, error: null })),
    },
  };
  return client as unknown as SupabaseClient;
}

/**
 * A fake of Supabase Storage's per-bucket API (`.storage.from(bucket)`),
 * for `lib/api/media.ts` tests. `list`/`upload`/`remove` are individually
 * overridable `vi.fn()`s (defaulting to an empty/successful result so a
 * test only has to override what it's actually exercising); `getPublicUrl`
 * defaults to a deterministic fake CDN URL built from the given path.
 */
export function createMockStorageClient(overrides?: {
  list?: ReturnType<typeof vi.fn>;
  upload?: ReturnType<typeof vi.fn>;
  remove?: ReturnType<typeof vi.fn>;
  getPublicUrl?: ReturnType<typeof vi.fn>;
}) {
  const bucket = {
    list: overrides?.list ?? vi.fn(async () => ({ data: [], error: null })),
    upload: overrides?.upload ?? vi.fn(async () => ({ data: { path: "mock-path" }, error: null })),
    remove: overrides?.remove ?? vi.fn(async () => ({ data: [], error: null })),
    getPublicUrl:
      overrides?.getPublicUrl ??
      vi.fn((path: string) => ({ data: { publicUrl: `https://mock.supabase.co/storage/v1/object/public/media/${path}` } })),
  };
  const client = {
    storage: { from: vi.fn(() => bucket) },
  };
  return { client: client as unknown as SupabaseClient, bucket };
}
