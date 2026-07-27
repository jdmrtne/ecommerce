import { useCallback, useEffect, useState } from "react";
import { apiDeleteMedia, apiListMedia, apiUploadMedia, formatBytes } from "@/lib/api/media";
import type { MediaAsset } from "@/lib/api/media";

export type MediaStatus = "loading" | "success" | "error";

/**
 * Media (Backend-Integrated). Replaces the Phase 24 `localStorage`-backed
 * hook of the same name: reads/writes now go through `lib/api/media.ts`
 * against the real Supabase Storage bucket, so this is async where the
 * old hook was synchronous. Used by `AssetPicker` and `MediaManager`.
 *
 * Same "server owns the truth" posture as `useProducts()`: `upload`/
 * `remove` re-fetch the full list afterwards rather than optimistically
 * patching local state.
 */

/** Per-file guard against an obviously-wrong upload (not an architecture limit - see `supabase/schema.sql`). */
export const MAX_ASSET_SOURCE_BYTES = 10_000_000; // 10MB

export type UploadResult = { ok: true; asset: MediaAsset } | { ok: false; error: string };

export function useMediaAssets() {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [status, setStatus] = useState<MediaStatus>("loading");

  const load = useCallback(() => {
    setStatus("loading");
    apiListMedia()
      .then((data) => {
        setAssets(data);
        setStatus("success");
      })
      .catch(() => setStatus("error"));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const upload = useCallback(
    async (file: File): Promise<UploadResult> => {
      if (file.size > MAX_ASSET_SOURCE_BYTES) {
        return {
          ok: false,
          error: `"${file.name}" is ${formatBytes(file.size)} - the limit per image is ${formatBytes(MAX_ASSET_SOURCE_BYTES)}.`,
        };
      }
      try {
        const asset = await apiUploadMedia(file);
        load();
        return { ok: true, asset };
      } catch (err) {
        return { ok: false, error: err instanceof Error ? err.message : "Upload failed." };
      }
    },
    [load],
  );

  const remove = useCallback(
    async (id: string) => {
      await apiDeleteMedia(id);
      load();
    },
    [load],
  );

  return { assets, status, reload: load, upload, remove };
}
