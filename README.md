# React + TypeScript + Vite

**Project documentation lives in [`docs/`](docs/):**
- [`docs/MASTER_HANDOFF.md`](docs/MASTER_HANDOFF.md) — current project
  state (architecture, folder/config structure, completed phases, known
  issues).
- [`docs/ROADMAP.md`](docs/ROADMAP.md) — what's next, phase by phase.
- [`docs/CHANGELOG.md`](docs/CHANGELOG.md) — full history.
- [`docs/CONTINUE_DEVELOPMENT_PROMPT.md`](docs/CONTINUE_DEVELOPMENT_PROMPT.md)
  — paste this to start any future development session; it's fully
  self-contained.

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

## Backend (Supabase)

Phase 25 added a real backend: [Supabase](https://supabase.com) (Postgres +
Auth + auto-generated API). Nothing in the UI uses it yet - this phase is
plumbing only (see `docs/ROADMAP.md`) - but the client layer and database
schema are ready for the phases that follow to wire in feature by feature.

**Setup:**
1. Copy `.env.example` to `.env` and fill in your Supabase project's URL
   and anon/publishable key (Project Settings > API on
   [supabase.com](https://supabase.com/dashboard)). `.env` is gitignored -
   never commit real credentials.
2. Run `supabase/schema.sql` against your project: Supabase dashboard >
   SQL Editor > New query > paste the file's contents > Run. It creates
   every table the API client expects (`products`, `categories`,
   `orders`, `profiles`) with Row Level Security enabled - see the
   comments at the top of that file for what's and isn't protected yet.
3. `npm run dev` - the app builds and runs identically to before; the new
   `src/lib/api/` layer just isn't called from anywhere yet.

**Local development against Supabase:** the simplest path is pointing
`.env` at your real (hosted) Supabase project, as above - there's no
local database to keep in sync otherwise. If you'd rather develop against
a fully local Postgres instance, the
[Supabase CLI](https://supabase.com/docs/guides/local-development) can
spin one up (`supabase init`, then `supabase start`, then apply
`supabase/schema.sql` as a migration) and prints a local URL/anon key to
put in `.env` instead.

**Where things live:**
- `src/lib/api/client.ts` - the Supabase client singleton (reads the env
  vars above).
- `src/lib/api/types.ts` - table row contracts and the map functions
  to/from this app's existing model types.
- `src/lib/api/{auth,products,categories,orders}.ts` - the API functions
  themselves, one file per domain, each mirroring an existing
  `localStorage`-backed module's function shapes 1:1 (see each file's
  doc comment for which one).
- `supabase/schema.sql` - the table definitions + RLS policies to run
  once against a fresh project.

**Authentication (Phase 26):** `AuthProvider` now signs up/logs in/logs
out for real against Supabase Auth, with an app-specific `profiles` row
(name + role) alongside every account. There is no admin-signup UI - to
make an account an admin:
1. Sign up normally through the site (creates a `role: "customer"` profile).
2. In the Supabase dashboard, Table Editor > `profiles`, change that row's
   `role` to `admin`.
3. Sign out and back in (or refresh) so the app picks up the new role.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.
