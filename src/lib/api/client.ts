import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Phase 25 - Backend Integration. Decision (per ROADMAP.md's "choose and
 * document the backend approach, confirmed with the user"): Supabase
 * (BaaS), confirmed by the project owner along with the project's own
 * URL/anon key. This is the only file that touches those env vars or
 * constructs a Supabase client - every `lib/api/*` module takes a
 * `client` parameter (defaulting to this singleton) instead of importing
 * `createClient` itself, so tests can inject a mock client without
 * touching real env vars or network (see `src/test/mockSupabaseClient.ts`).
 *
 * The anon/publishable key (`VITE_SUPABASE_ANON_KEY`) is safe to ship in
 * client-side code - that's what it's for, and what actually gates access
 * is Postgres Row Level Security on each table (`supabase/schema.sql`),
 * not keeping this key secret. There is no separate service-role key
 * anywhere in this app.
 */
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Warn rather than throw: this file is imported transitively by every
  // `lib/api/*` module, and this phase doesn't wire any of them into the
  // UI yet, so a missing `.env` shouldn't crash the whole app or the test
  // suite - just make any real Supabase call fail loudly instead.
  console.warn(
    "VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are not set. Copy .env.example to .env and fill them in - see docs/MASTER_HANDOFF.md (Phase 25). API calls will fail until then.",
  );
}

export const supabase: SupabaseClient = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder-anon-key",
);
