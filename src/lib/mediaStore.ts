import { storageKey } from "@/config/branding";

/**
 * Phase 24 - Media Manager. A basic asset store for admins to attach
 * images (logo, favicon, product photos) without a real backend yet.
 *
 * Decision (per ROADMAP.md's "decide and document"): assets are stored as
 * base64 data URLs in `localStorage`, not IndexedDB. `localStorage` keeps
 * this store consistent with every other Phase 16-23 override (same
 * `storageKey()` namespacing, same synchronous read/resolve API, same
 * same-tab `CustomEvent` + cross-tab `storage` event reactivity model) and
 * is simpler to reason about and test. The tradeoff is `localStorage`'s
 * ~5MB-per-origin budget (shared with every other override this template
 * saves - cart, wishlist, products, theme, ...), so this store enforces an
 * explicit per-file size cap and a total-media-storage budget (see
 * `MAX_ASSET_SOURCE_BYTES`/`MAX_TOTAL_MEDIA_BYTES` below) and reports a
 * clear error instead of silently failing or corrupting other saved data.
 * If real product photography or a growing catalog ever needs more
 * headroom than that budget allows, IndexedDB (no practical size cap, but
 * an async API that would ripple through every synchronous `resolveX()`
 * call site in this codebase) is the documented upgrade path - and Phase
 * 25 (Backend Integration) replaces this entire layer with real file
 * storage regardless, so it isn't worth that migration twice.
 *
 * Unlike Products/Categories/Policies, there is no static seed data for
 * media assets to layer an override on top of - every asset here was
 * created by an admin, so this store is a plain persisted list, not an
 * override-over-defaults resolver.
 */
export interface MediaAsset {
  id: string;
  /** Original filename, for display only. */
  name: string;
  /** MIME type, e.g. "image/png". */
  type: string;
  /** The base64 data URL - what actually gets rendered and stored. */
  dataUrl: string;
  /** Original file size in bytes, for display (the stored `dataUrl` is larger, due to base64 overhead). */
  size: number;
  /** ISO timestamp of upload. */
  createdAt: string;
}

/** Per-file cap on the *original* (pre-base64) file size. */
export const MAX_ASSET_SOURCE_BYTES = 1_000_000; // 1MB

/**
 * Total budget for all stored `dataUrl`s combined (measured by encoded
 * string length, which is what's actually written to `localStorage`) -
 * kept well under the ~5MB/origin browsers typically allow, leaving room
 * for every other override this template persists.
 */
export const MAX_TOTAL_MEDIA_BYTES = 4_500_000; // 4.5MB

const STORAGE_KEY = storageKey("media-assets");

/** Dispatched whenever an asset is added or removed, so `useMediaAssets()` re-renders in the same tab. */
export const MEDIA_CHANGE_EVENT = "mediachange";

function notifyChange() {
  window.dispatchEvent(new Event(MEDIA_CHANGE_EVENT));
}

/** Reads every saved asset, defensively - never throws, never returns partial garbage. */
export function getAllAssets(): MediaAsset[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (entry): entry is MediaAsset =>
        typeof entry === "object" &&
        entry !== null &&
        typeof (entry as MediaAsset).id === "string" &&
        typeof (entry as MediaAsset).dataUrl === "string",
    );
  } catch {
    return [];
  }
}

/** Sum of every stored asset's `dataUrl` length - the actual `localStorage` cost, not the original file size. */
export function getTotalStoredBytes(assets: MediaAsset[] = getAllAssets()): number {
  return assets.reduce((sum, asset) => sum + asset.dataUrl.length, 0);
}

function persist(assets: MediaAsset[]): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(assets));
}

function generateAssetId(): string {
  return `asset-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export interface AddAssetInput {
  name: string;
  type: string;
  dataUrl: string;
  size: number;
}

export type AddAssetResult = { ok: true; asset: MediaAsset } | { ok: false; error: string };

/**
 * Validates and persists a new asset. Enforces both size guards: the
 * source file itself must be under `MAX_ASSET_SOURCE_BYTES`, and adding it
 * must not push the total stored `dataUrl` bytes over
 * `MAX_TOTAL_MEDIA_BYTES`. Also catches a `localStorage` quota error
 * (e.g. a browser with a smaller real-world budget than assumed) as a
 * last-resort safety net, rather than letting it throw uncaught.
 */
export function addAsset(input: AddAssetInput): AddAssetResult {
  if (typeof window === "undefined") return { ok: false, error: "Not available." };

  if (input.size > MAX_ASSET_SOURCE_BYTES) {
    return {
      ok: false,
      error: `"${input.name}" is ${formatBytes(input.size)} - the limit per image is ${formatBytes(MAX_ASSET_SOURCE_BYTES)}.`,
    };
  }

  const existing = getAllAssets();
  const projectedTotal = getTotalStoredBytes(existing) + input.dataUrl.length;
  if (projectedTotal > MAX_TOTAL_MEDIA_BYTES) {
    return {
      ok: false,
      error: `Adding "${input.name}" would exceed the ${formatBytes(MAX_TOTAL_MEDIA_BYTES)} media storage budget. Delete an unused image first.`,
    };
  }

  const asset: MediaAsset = {
    id: generateAssetId(),
    name: input.name,
    type: input.type,
    dataUrl: input.dataUrl,
    size: input.size,
    createdAt: new Date().toISOString(),
  };

  try {
    persist([...existing, asset]);
  } catch {
    return {
      ok: false,
      error: "Your browser's storage is full. Delete an unused image and try again.",
    };
  }

  notifyChange();
  return { ok: true, asset };
}

/** Removes one asset by id. No-op if it doesn't exist. */
export function removeAsset(id: string): void {
  if (typeof window === "undefined") return;
  const next = getAllAssets().filter((asset) => asset.id !== id);
  persist(next);
  notifyChange();
}

/** Reads a `File` into a base64 data URL. Rejects on `FileReader` error. */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error("Failed to read file."));
    reader.readAsDataURL(file);
  });
}

/** Human-readable byte size, e.g. "482 KB" or "1.2 MB". */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
