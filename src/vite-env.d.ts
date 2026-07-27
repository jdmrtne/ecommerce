/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Supabase project URL. See `.env.example` / `docs/MASTER_HANDOFF.md` (Phase 25). */
  readonly VITE_SUPABASE_URL: string;
  /** Supabase anon/publishable key - safe to expose client-side, per Supabase's own design. */
  readonly VITE_SUPABASE_ANON_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
