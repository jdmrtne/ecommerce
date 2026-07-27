import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/lib/api/client";

/**
 * Media (Backend-Integrated). Replaces Phase 24's `lib/mediaStore.ts`
 * (base64 data URLs in `localStorage`, capped at 1MB/file and 4.5MB
 * total). Uploads now go to a public Supabase Storage bucket (`media`,
 * see `supabase/schema.sql`) - real object storage, so there's no
 * app-level total-budget cap left to enforce. `client` defaults to the
 * app singleton but is overridable so tests can inject a mock instead of
 * hitting the network (see `media.test.ts` / `src/test/mockSupabaseClient.ts`).
 */

const BUCKET = "media";

export interface MediaAsset {
  /** The object's storage path - also its stable key for select/delete. */
  id: string;
  /** Display name. Derived from the storage path for objects already in
   *  the bucket (see `sanitizeFileName`); the exact original filename for
   *  an asset just uploaded in this session. */
  name: string;
  /** Public URL - what actually gets rendered and stored on branding/product fields. */
  url: string;
  /** MIME type, e.g. "image/png". */
  type: string;
  /** File size in bytes, for display. */
  size: number;
  /** ISO timestamp of upload. */
  createdAt: string;
}

/** Strips characters Supabase Storage paths don't like, keeping the name recognizable. */
function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9.\-_]+/g, "_");
}

/** Undoes the `<timestamp>-<random>-` prefix `apiUploadMedia` adds, for display purposes. */
function displayNameFromPath(path: string): string {
  return path.replace(/^\d+-[a-z0-9]{6}-/, "");
}

function toAsset(path: string, url: string, size: number, type: string, createdAt: string): MediaAsset {
  return { id: path, name: displayNameFromPath(path), url, size, type, createdAt };
}

/** Lists every asset in the bucket, newest first. */
export async function apiListMedia(client: SupabaseClient = supabase): Promise<MediaAsset[]> {
  const { data, error } = await client.storage.from(BUCKET).list("", {
    sortBy: { column: "created_at", order: "desc" },
  });
  if (error) throw new Error(error.message);

  return (data ?? [])
    .filter((entry) => entry.id !== null) // skip Storage's placeholder folder entries
    .map((entry) => {
      const { data: pub } = client.storage.from(BUCKET).getPublicUrl(entry.name);
      return toAsset(
        entry.name,
        pub.publicUrl,
        entry.metadata?.size ?? 0,
        entry.metadata?.mimetype ?? "application/octet-stream",
        entry.created_at ?? new Date().toISOString(),
      );
    });
}

/** Uploads a file, returning its stored asset (including the public URL). */
export async function apiUploadMedia(file: File, client: SupabaseClient = supabase): Promise<MediaAsset> {
  const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${sanitizeFileName(file.name)}`;
  const { error } = await client.storage.from(BUCKET).upload(path, file, { contentType: file.type });
  if (error) throw new Error(error.message);

  const { data: pub } = client.storage.from(BUCKET).getPublicUrl(path);
  return {
    id: path,
    name: file.name,
    url: pub.publicUrl,
    size: file.size,
    type: file.type,
    createdAt: new Date().toISOString(),
  };
}

/** Deletes an asset by its storage path (`MediaAsset.id`). No-op if it doesn't exist. */
export async function apiDeleteMedia(path: string, client: SupabaseClient = supabase): Promise<void> {
  const { error } = await client.storage.from(BUCKET).remove([path]);
  if (error) throw new Error(error.message);
}

/** Human-readable byte size, e.g. "482 KB" or "1.2 MB". */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
