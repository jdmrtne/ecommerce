import { useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { Upload, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { EmptyState, ErrorState } from "@/components/ui/StateMessage";
import { Skeleton } from "@/components/ui/Skeleton";
import { useMediaAssets, MAX_ASSET_SOURCE_BYTES } from "@/hooks/useMediaAssets";
import { formatBytes } from "@/lib/api/media";
import type { MediaAsset } from "@/lib/api/media";
import { PAGE_META } from "@/config/site";
import { useSiteMeta } from "@/hooks/useSiteMeta";
import { ERROR_STATES } from "@/content/states";

/**
 * Media (Backend-Integrated). The full library view: every image an
 * admin has uploaded across the whole site (via this page or via
 * `AssetPicker` from Store Settings/Product Manager - they share the
 * same `useMediaAssets()`/`lib/api/media.ts`), with upload and delete
 * against the real `media` Storage bucket.
 *
 * This page and `AssetPicker` are deliberately separate: this is "browse
 * and manage everything", `AssetPicker` is "pick one image for this
 * field" (embedded inline wherever an image field lives). Both read/write
 * the same store, so an image uploaded from either shows up in both.
 */
export function MediaManager() {
  useSiteMeta(PAGE_META.adminMedia);
  const { assets, status, reload, upload, remove } = useMediaAssets();

  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<MediaAsset | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);
    const result = await upload(file);
    if (!result.ok) setUploadError(result.error);
    setIsUploading(false);
  }

  function confirmDelete() {
    if (pendingDelete) remove(pendingDelete.id);
    setPendingDelete(null);
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <SectionHeading eyebrow="Admin" title="Media Library" align="left" />
        <Button
          type="button"
          icon={<Upload size={16} />}
          isLoading={isUploading}
          onClick={() => fileInputRef.current?.click()}
        >
          Upload image
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={handleFileChange}
          aria-label="Upload image"
        />
      </div>

      <p className="mt-2 text-sm text-ink-soft">
        Images uploaded here are stored in your project's media bucket, not this browser - they're available on
        every device and to every visitor, with no total-storage cap. Up to{" "}
        {formatBytes(MAX_ASSET_SOURCE_BYTES)} per file. Use the <span className="font-medium">Choose image</span>{" "}
        control on Store Settings (logo/favicon) and Product Manager (product images) to attach one of these to
        your site.
      </p>

      {uploadError && (
        <p role="alert" className="mt-4 text-sm text-error">
          {uploadError}
        </p>
      )}

      <Card padding="md" className="mt-6">
        {status === "loading" ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square w-full rounded-md" />
            ))}
          </div>
        ) : status === "error" ? (
          <ErrorState {...ERROR_STATES.media} onAction={reload} />
        ) : assets.length === 0 ? (
          <EmptyState title="No images yet" description="Upload one to make it available across the site." />
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {assets.map((asset) => (
              <div key={asset.id} className="flex flex-col gap-2">
                <div className="aspect-square overflow-hidden rounded-md border-2 border-beige bg-beige/40">
                  <img src={asset.url} alt={asset.name} className="h-full w-full object-cover" />
                </div>
                <p className="truncate text-xs font-medium text-ink" title={asset.name}>
                  {asset.name}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-ink-soft">{formatBytes(asset.size)}</span>
                  <button
                    type="button"
                    onClick={() => setPendingDelete(asset)}
                    aria-label={`Delete ${asset.name}`}
                    className="rounded-md border-2 border-beige p-1.5 text-ink-soft hover:border-error/60 hover:text-error"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Modal isOpen={pendingDelete !== null} onClose={() => setPendingDelete(null)} title="Delete image" size="sm">
        <p className="text-sm text-ink-soft">
          Delete <span className="font-medium text-ink">{pendingDelete?.name}</span>? Anything currently using this
          image (a logo, favicon, or product photo) will show a broken image until it&apos;s replaced. This
          can&apos;t be undone.
        </p>
        <div className="mt-6 flex items-center gap-3">
          <Button type="button" variant="danger" onClick={confirmDelete}>
            Delete
          </Button>
          <Button type="button" variant="ghost" onClick={() => setPendingDelete(null)}>
            Cancel
          </Button>
        </div>
      </Modal>
    </div>
  );
}
