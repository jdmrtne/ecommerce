import { describe, expect, it, vi } from "vitest";
import { apiDeleteMedia, apiListMedia, apiUploadMedia, formatBytes } from "@/lib/api/media";
import { createMockStorageClient } from "@/test/mockSupabaseClient";

function makeFile(name: string, type: string, sizeBytes: number): File {
  return new File([new Uint8Array(sizeBytes)], name, { type });
}

describe("lib/api/media", () => {
  it("apiListMedia maps every object to an asset with its public URL, newest first", async () => {
    const list = vi.fn(async () => ({
      data: [
        {
          id: "obj-1",
          name: "1700000000000-ab12cd-basket.png",
          created_at: "2026-01-02T00:00:00.000Z",
          metadata: { size: 12345, mimetype: "image/png" },
        },
      ],
      error: null,
    }));
    const { client, bucket } = createMockStorageClient({ list });

    const assets = await apiListMedia(client);

    expect(bucket.list).toHaveBeenCalledWith("", { sortBy: { column: "created_at", order: "desc" } });
    expect(assets).toEqual([
      {
        id: "1700000000000-ab12cd-basket.png",
        name: "basket.png",
        url: "https://mock.supabase.co/storage/v1/object/public/media/1700000000000-ab12cd-basket.png",
        size: 12345,
        type: "image/png",
        createdAt: "2026-01-02T00:00:00.000Z",
      },
    ]);
  });

  it("apiListMedia skips Storage's placeholder folder entries (null id)", async () => {
    const list = vi.fn(async () => ({
      data: [{ id: null, name: ".emptyFolderPlaceholder", created_at: null, metadata: null }],
      error: null,
    }));
    const { client } = createMockStorageClient({ list });

    expect(await apiListMedia(client)).toEqual([]);
  });

  it("apiListMedia returns an empty array when there are no objects", async () => {
    const { client } = createMockStorageClient({ list: vi.fn(async () => ({ data: null, error: null })) });
    expect(await apiListMedia(client)).toEqual([]);
  });

  it("apiListMedia throws with the Storage error message on failure", async () => {
    const { client } = createMockStorageClient({
      list: vi.fn(async () => ({ data: null, error: { message: "bucket not found" } })),
    });
    await expect(apiListMedia(client)).rejects.toThrow("bucket not found");
  });

  it("apiUploadMedia uploads under a unique path and returns the asset with its public URL", async () => {
    const upload = vi.fn(async (_path: string, _file: File, _options?: { contentType?: string }) => ({
      data: { path: "mock-path" },
      error: null,
    }));
    const { client, bucket } = createMockStorageClient({ upload });
    const file = makeFile("my photo.png", "image/png", 2048);

    const asset = await apiUploadMedia(file, client);

    expect(bucket.upload).toHaveBeenCalledTimes(1);
    const [path, uploadedFile, options] = upload.mock.calls[0];
    expect(path).toMatch(/^\d+-[a-z0-9]{6}-my_photo\.png$/);
    expect(uploadedFile).toBe(file);
    expect(options).toEqual({ contentType: "image/png" });

    expect(asset.name).toBe("my photo.png");
    expect(asset.size).toBe(2048);
    expect(asset.type).toBe("image/png");
    expect(asset.url).toBe(`https://mock.supabase.co/storage/v1/object/public/media/${path}`);
  });

  it("apiUploadMedia throws with the Storage error message on failure", async () => {
    const { client } = createMockStorageClient({
      upload: vi.fn(async () => ({ data: null, error: { message: "file too large" } })),
    });
    await expect(apiUploadMedia(makeFile("a.png", "image/png", 10), client)).rejects.toThrow("file too large");
  });

  it("apiDeleteMedia removes by path", async () => {
    const remove = vi.fn(async () => ({ data: [], error: null }));
    const { client, bucket } = createMockStorageClient({ remove });

    await apiDeleteMedia("some-path.png", client);

    expect(bucket.remove).toHaveBeenCalledWith(["some-path.png"]);
  });

  it("apiDeleteMedia throws with the Storage error message on failure", async () => {
    const { client } = createMockStorageClient({
      remove: vi.fn(async () => ({ data: null, error: { message: "not found" } })),
    });
    await expect(apiDeleteMedia("missing.png", client)).rejects.toThrow("not found");
  });

  it("formatBytes formats bytes, KB, and MB", () => {
    expect(formatBytes(500)).toBe("500 B");
    expect(formatBytes(48200)).toBe("47 KB");
    expect(formatBytes(1_200_000)).toBe("1.1 MB");
  });
});
