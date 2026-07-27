import { beforeEach, describe, expect, it } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { useMediaAssets, MAX_ASSET_SOURCE_BYTES } from "@/hooks/useMediaAssets";
import { fakeSupabase } from "@/test/fakeSupabaseAuth";

function makeFile(name: string, sizeBytes: number, type = "image/png"): File {
  const bytes = new Uint8Array(sizeBytes);
  return new File([bytes], name, { type });
}

describe("useMediaAssets", () => {
  beforeEach(() => {
    fakeSupabase.__reset();
  });

  it("starts loading, then resolves to an empty library against a fresh backend", async () => {
    const { result } = renderHook(() => useMediaAssets());
    expect(result.current.status).toBe("loading");

    await waitFor(() => expect(result.current.status).toBe("success"));
    expect(result.current.assets).toEqual([]);
  });

  it("upload() stores the file and re-renders with it in the library", async () => {
    const { result } = renderHook(() => useMediaAssets());
    await waitFor(() => expect(result.current.status).toBe("success"));

    await act(async () => {
      const outcome = await result.current.upload(makeFile("swatch.png", 100));
      expect(outcome.ok).toBe(true);
    });

    expect(result.current.assets).toHaveLength(1);
    expect(result.current.assets[0].name).toBe("swatch.png");
    expect(result.current.assets[0].url).toContain("swatch.png");
  });

  it("upload() rejects a file over the per-asset size limit without adding it", async () => {
    const { result } = renderHook(() => useMediaAssets());
    await waitFor(() => expect(result.current.status).toBe("success"));

    await act(async () => {
      const outcome = await result.current.upload(makeFile("huge.png", MAX_ASSET_SOURCE_BYTES + 1));
      expect(outcome.ok).toBe(false);
    });

    expect(result.current.assets).toHaveLength(0);
  });

  it("remove() drops an asset and re-renders immediately", async () => {
    const { result } = renderHook(() => useMediaAssets());
    await waitFor(() => expect(result.current.status).toBe("success"));

    await act(async () => {
      await result.current.upload(makeFile("swatch.png", 100));
    });
    const id = result.current.assets[0].id;

    await act(async () => {
      await result.current.remove(id);
    });

    expect(result.current.assets).toHaveLength(0);
  });
});
