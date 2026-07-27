# Handoff — Media (Backend-Integrated)

Requested directly by the project owner ("connect the media images
upload to the database so I won't have a cap on uploading images"), not
the next scheduled `ROADMAP.md` phase (that remains **29 — Inventory**).
This work sits outside the numbered phase sequence, the same way
Settings Sync does — see `docs/ROADMAP.md`'s Status note and
`docs/MASTER_HANDOFF.md`'s Current Progress section for the permanent
record; this file is a narrower, single-session write-up.

## 1. What changed and why

Phase 24's Media Manager (`lib/mediaStore.ts`) stored every
admin-uploaded image as a base64 data URL in `localStorage`. That store
enforced two size guards purely because `localStorage` itself is
tiny: **1MB per file** and a **4.5MB total budget across every image
on the whole site** — logo, favicon, and every product photo combined.
That total budget was the cap you were hitting.

This session replaces that store with a real, public **Supabase Storage
bucket** (`media`). Real object storage has no equivalent total-budget
concept, so that cap is gone entirely. A generous **10MB per-file**
guard remains (client-side, to catch an obviously-wrong upload before
it hits the network) — not an architecture limit like before.

## 2. Setup required on your end

Nothing in the UI changes how you use it — Store Settings, Product
Manager, and the Media Library page all work the same way. But **you do
need to run the updated `supabase/schema.sql` once** against your
Supabase project (SQL Editor → New query → paste the new section at the
bottom → Run) to create the `media` bucket and its access policies. If
you already ran the full file before, you only need the new section —
it's additive and safe to re-run (`on conflict (id) do nothing` on the
bucket insert).

## 3. Files Added

```
src/lib/api/media.ts          — apiListMedia/apiUploadMedia/apiDeleteMedia
                                 against the Supabase Storage `media` bucket
src/lib/api/media.test.ts     — tests via a mock storage client
HANDOFF-MEDIA-BACKEND.md      — this file
```

## 4. Files Modified

```
supabase/schema.sql           — creates the public `media` bucket + RLS
                                 policies (public read, admin-only insert/delete)
src/hooks/useMediaAssets.ts   — rewritten as an async hook (loading/success/
                                 error status, re-fetch after upload/remove),
                                 same shape as useProducts()
src/hooks/useMediaAssets.test.ts
src/components/admin/AssetPicker.tsx
                               — renders asset.url instead of asset.dataUrl;
                                 shows real loading/error states; upload
                                 copy no longer mentions "this browser"
src/components/admin/AssetPicker.test.tsx
src/pages/admin/MediaManager.tsx
                               — same url/loading/error changes; storage-
                                 usage progress bar removed (no total
                                 budget left to show progress against)
src/pages/admin/MediaManager.test.tsx
src/pages/admin/StoreSettings.tsx, src/pages/admin/ProductManager.tsx
                               — AssetPicker onSelect callback parameter
                                 renamed dataUrl -> url (no behavior change,
                                 both already just forwarded a plain string)
src/content/states.ts         — added ERROR_STATES.media
src/test/fakeSupabaseAuth.ts  — added an in-memory .storage.from("media")
                                 fake alongside the existing table fakes,
                                 so every test that renders AssetPicker/
                                 MediaManager works with no network
src/test/mockSupabaseClient.ts — added createMockStorageClient(), the
                                 lib/api/media.test.ts equivalent of the
                                 existing createMockSupabaseClient()
docs/CHANGELOG.md, docs/ROADMAP.md, docs/MASTER_HANDOFF.md
                               — documented this work per the project's
                                 existing "out-of-sequence feature" convention
```

## 5. Files Removed

```
src/lib/mediaStore.ts         — fully superseded by lib/api/media.ts
src/lib/mediaStore.test.ts
```

## 6. Architecture Decisions

- **No data migration for old images.** Anything uploaded under Phase
  24's `localStorage` store has no path to the new bucket — those data
  URLs never left the browser they were uploaded in. Phase 24 was
  explicitly documented as a pre-backend stopgap for exactly this
  eventuality, so this is expected, not an oversight. If you'd uploaded
  a logo/favicon/product photos before, you'll need to re-upload them
  once through the new Media Library.
- **Storage path, not a database table, is the source of truth.**
  `apiListMedia()` reads directly from the bucket's object list
  (`storage.list()`) rather than maintaining a separate `media_assets`
  table — an object's path *is* its stable id, and Storage already
  tracks size/mimetype/created-at per object. This keeps upload/delete
  to one write instead of two (an upload that succeeds in Storage but
  fails to insert a row would otherwise leave things out of sync).
  Display names are recovered from the stored path (a
  `<timestamp>-<random>-` prefix is stripped) rather than kept in a
  separate metadata table — close to the original filename, not
  byte-perfect for unusual characters, a reasonable trade for one fewer
  moving part.
- **10MB per-file guard is a mistake-catcher, not an architecture
  limit.** Supabase's own project-level upload ceiling (50MB by default)
  is the real backstop; this just keeps an admin from accidentally
  attaching a multi-hundred-MB file to a product photo field.

## 7. QA Checklist

- [x] `tsc -b` — clean
- [x] `vite build` — clean production build
- [x] `npx oxlint src` — 0 warnings, 0 errors
- [x] `npm test` — 445/445 tests passing across 72 files
- [x] `AssetPicker`/`MediaManager` both show a loading state, then the
      real library, or a retry-able error state
- [ ] Manual QA against a real Supabase project (upload/delete a real
      image, confirm it's visible from another browser/device) — not run
      this session, no live project credentials available here;
      recommended before you next deploy
