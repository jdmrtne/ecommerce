import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  MAX_ASSET_SOURCE_BYTES,
  MAX_TOTAL_MEDIA_BYTES,
  MEDIA_CHANGE_EVENT,
  addAsset,
  formatBytes,
  getAllAssets,
  getTotalStoredBytes,
  removeAsset,
} from "@/lib/mediaStore";

function input(overrides: Partial<{ name: string; type: string; dataUrl: string; size: number }> = {}) {
  return {
    name: "swatch.png",
    type: "image/png",
    dataUrl: "data:image/png;base64,AAAA",
    size: 1000,
    ...overrides,
  };
}

describe("mediaStore", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("starts with an empty library", () => {
    expect(getAllAssets()).toEqual([]);
    expect(getTotalStoredBytes()).toBe(0);
  });

  it("adds a valid asset and persists it", () => {
    const result = addAsset(input({ name: "logo.png" }));
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("expected ok");

    expect(result.asset.name).toBe("logo.png");
    expect(result.asset.id).toBeTruthy();
    expect(result.asset.createdAt).toBeTruthy();

    const stored = getAllAssets();
    expect(stored).toHaveLength(1);
    expect(stored[0].dataUrl).toBe("data:image/png;base64,AAAA");
  });

  it("persists across a fresh read (survives a refresh)", () => {
    addAsset(input({ name: "hero.png" }));
    // Simulate a refresh: nothing but localStorage carries over.
    expect(getAllAssets().map((a) => a.name)).toEqual(["hero.png"]);
  });

  it("rejects a file over the per-asset size limit and does not persist it", () => {
    const result = addAsset(input({ size: MAX_ASSET_SOURCE_BYTES + 1 }));
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("expected rejection");
    expect(result.error).toMatch(/limit/i);
    expect(getAllAssets()).toHaveLength(0);
  });

  it("accepts a file exactly at the per-asset size limit", () => {
    const result = addAsset(input({ size: MAX_ASSET_SOURCE_BYTES }));
    expect(result.ok).toBe(true);
  });

  it("rejects an asset that would push total stored bytes over the media storage budget", () => {
    // A dataUrl just under half the budget, added twice, pushes the total over.
    const bigDataUrl = "data:image/png;base64," + "A".repeat(Math.floor(MAX_TOTAL_MEDIA_BYTES * 0.6));
    const first = addAsset(input({ name: "first.png", dataUrl: bigDataUrl, size: 500 }));
    expect(first.ok).toBe(true);

    const second = addAsset(input({ name: "second.png", dataUrl: bigDataUrl, size: 500 }));
    expect(second.ok).toBe(false);
    if (second.ok) throw new Error("expected rejection");
    expect(second.error).toMatch(/budget/i);

    // Only the first asset was persisted - the rejected one left no trace.
    expect(getAllAssets().map((a) => a.name)).toEqual(["first.png"]);
  });

  it("removes an asset by id", () => {
    const result = addAsset(input({ name: "to-delete.png" }));
    if (!result.ok) throw new Error("expected ok");

    removeAsset(result.asset.id);
    expect(getAllAssets()).toHaveLength(0);
  });

  it("removing an unknown id is a no-op", () => {
    addAsset(input({ name: "keep.png" }));
    removeAsset("not-a-real-id");
    expect(getAllAssets()).toHaveLength(1);
  });

  it("dispatches the change event on add and on remove", () => {
    const handler = vi.fn();
    window.addEventListener(MEDIA_CHANGE_EVENT, handler);

    const result = addAsset(input());
    expect(handler).toHaveBeenCalledTimes(1);

    if (result.ok) removeAsset(result.asset.id);
    expect(handler).toHaveBeenCalledTimes(2);

    window.removeEventListener(MEDIA_CHANGE_EVENT, handler);
  });

  it("does not dispatch a change event when a rejected upload fails validation", () => {
    const handler = vi.fn();
    window.addEventListener(MEDIA_CHANGE_EVENT, handler);

    addAsset(input({ size: MAX_ASSET_SOURCE_BYTES + 1 }));
    expect(handler).not.toHaveBeenCalled();

    window.removeEventListener(MEDIA_CHANGE_EVENT, handler);
  });

  it("treats corrupted localStorage content as an empty library rather than throwing", () => {
    window.localStorage.setItem("store-media-assets", "{not valid json");
    expect(getAllAssets()).toEqual([]);

    window.localStorage.setItem("store-media-assets", JSON.stringify({ not: "an array" }));
    expect(getAllAssets()).toEqual([]);
  });

  it("filters out malformed entries within an otherwise-valid array", () => {
    window.localStorage.setItem(
      "store-media-assets",
      JSON.stringify([{ id: "a1", name: "ok.png", type: "image/png", dataUrl: "data:x", size: 10, createdAt: "now" }, { missing: "fields" }, null]),
    );
    const assets = getAllAssets();
    expect(assets).toHaveLength(1);
    expect(assets[0].id).toBe("a1");
  });

  describe("formatBytes", () => {
    it("formats bytes, kilobytes, and megabytes", () => {
      expect(formatBytes(500)).toBe("500 B");
      expect(formatBytes(2048)).toBe("2 KB");
      expect(formatBytes(2 * 1024 * 1024)).toBe("2.0 MB");
    });
  });
});
