import { useCallback, useEffect, useState } from "react";
import {
  MEDIA_CHANGE_EVENT,
  addAsset,
  fileToDataUrl,
  getAllAssets,
  getTotalStoredBytes,
  removeAsset,
  MAX_TOTAL_MEDIA_BYTES,
} from "@/lib/mediaStore";
import type { AddAssetResult } from "@/lib/mediaStore";

/**
 * Reactive read/write access to the Phase 24 media library. Same
 * subscription shape as every prior editor hook (`useStoreSettings`,
 * `useProducts`, ...) - re-renders on `MEDIA_CHANGE_EVENT` (same-tab
 * upload/delete) and the native `storage` event (a different tab/window).
 *
 * `upload(file)` wraps `fileToDataUrl()` + `addAsset()` into a single
 * async call so components (`AssetPicker`, `MediaManager`) don't each
 * reimplement the `FileReader` step.
 */
export function useMediaAssets() {
  const [, forceRerender] = useState(0);

  useEffect(() => {
    const handleChange = () => forceRerender((n) => n + 1);
    window.addEventListener(MEDIA_CHANGE_EVENT, handleChange);
    window.addEventListener("storage", handleChange);
    return () => {
      window.removeEventListener(MEDIA_CHANGE_EVENT, handleChange);
      window.removeEventListener("storage", handleChange);
    };
  }, []);

  const upload = useCallback(async (file: File): Promise<AddAssetResult> => {
    const dataUrl = await fileToDataUrl(file);
    return addAsset({ name: file.name, type: file.type, size: file.size, dataUrl });
  }, []);

  const remove = useCallback((id: string) => {
    removeAsset(id);
  }, []);

  const assets = getAllAssets();

  return {
    assets,
    totalBytes: getTotalStoredBytes(assets),
    budgetBytes: MAX_TOTAL_MEDIA_BYTES,
    upload,
    remove,
  };
}
