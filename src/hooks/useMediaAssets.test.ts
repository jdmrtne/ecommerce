import { beforeEach, describe, expect, it } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useMediaAssets } from "@/hooks/useMediaAssets";
import { MAX_ASSET_SOURCE_BYTES, MAX_TOTAL_MEDIA_BYTES } from "@/lib/mediaStore";

function makeFile(name: string, sizeBytes: number, type = "image/png"): File {
  const bytes = new Uint8Array(sizeBytes);
  return new File([bytes], name, { type });
}

describe("useMediaAssets", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("starts with an empty library and the documented budget", () => {
    const { result } = renderHook(() => useMediaAssets());
    expect(result.current.assets).toEqual([]);
    expect(result.current.totalBytes).toBe(0);
    expect(result.current.budgetBytes).toBe(MAX_TOTAL_MEDIA_BYTES);
  });

  it("upload() reads a File into a data URL and re-renders with it in the same tab", async () => {
    const { result } = renderHook(() => useMediaAssets());

    await act(async () => {
      const outcome = await result.current.upload(makeFile("swatch.png", 100));
      expect(outcome.ok).toBe(true);
    });

    expect(result.current.assets).toHaveLength(1);
    expect(result.current.assets[0].name).toBe("swatch.png");
    expect(result.current.assets[0].dataUrl.startsWith("data:image/png;base64,")).toBe(true);
  });

  it("upload() rejects a file over the per-asset size limit without adding it", async () => {
    const { result } = renderHook(() => useMediaAssets());

    await act(async () => {
      const outcome = await result.current.upload(makeFile("huge.png", MAX_ASSET_SOURCE_BYTES + 1));
      expect(outcome.ok).toBe(false);
    });

    expect(result.current.assets).toHaveLength(0);
  });

  it("remove() drops an asset and re-renders immediately", async () => {
    const { result } = renderHook(() => useMediaAssets());

    await act(async () => {
      await result.current.upload(makeFile("swatch.png", 100));
    });
    const id = result.current.assets[0].id;

    act(() => {
      result.current.remove(id);
    });

    expect(result.current.assets).toHaveLength(0);
  });
});
