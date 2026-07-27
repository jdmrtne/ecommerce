import { useRef, useState } from "react";
import type { ChangeEvent, ReactNode } from "react";
import { Image as ImageIcon, Upload, Trash2, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useMediaAssets, MAX_ASSET_SOURCE_BYTES } from "@/hooks/useMediaAssets";
import { formatBytes } from "@/lib/api/media";
import { cn } from "@/lib/cn";

interface AssetPickerProps {
  /** Called with the selected asset's public URL. Closes the modal on selection. */
  onSelect: (url: string) => void;
  /** Current value, shown as a small preview next to the trigger button. */
  value?: string;
  /** Trigger button label. Defaults to "Choose image". */
  label?: string;
  /** Restricts the upload input to a narrower aspect (informational hint only, e.g. for favicons). */
  hint?: string;
}

/**
 * Media (Backend-Integrated). Reusable "attach an image" control: a
 * trigger button (with an optional small preview of the current value)
 * that opens a modal combining upload + a grid of every previously-
 * uploaded asset. Picking or uploading an asset calls `onSelect(url)`
 * with the asset's public Storage URL - every field this attaches to
 * (`branding.logo`, `branding.favicon`, a product's `images[]`) already
 * stores a plain string URL, so this slots in with no schema change.
 *
 * Used from Store Settings (logo/favicon) and Product Manager (product
 * images) - see `MASTER_HANDOFF.md` for the full list. Both call sites
 * share the same library of previously-uploaded assets via
 * `useMediaAssets()`, so an image uploaded for one product is reusable
 * for another without re-uploading.
 */
export function AssetPicker({ onSelect, value, label = "Choose image", hint }: AssetPickerProps) {
  const { assets, status, upload, remove } = useMediaAssets();
  const [isOpen, setIsOpen] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function close() {
    setIsOpen(false);
    setUploadError(null);
  }

  function selectAsset(url: string) {
    onSelect(url);
    close();
  }

  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);
    const result = await upload(file);
    if (!result.ok) {
      setUploadError(result.error);
    } else {
      selectAsset(result.asset.url);
    }
    setIsUploading(false);
  }

  return (
    <div className="flex items-center gap-3">
      {value && (
        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md border-2 border-beige bg-beige/40">
          <img src={value} alt="" className="h-full w-full object-cover" />
        </div>
      )}
      <Button type="button" variant="outline" size="sm" icon={<ImageIcon size={16} />} onClick={() => setIsOpen(true)}>
        {label}
      </Button>

      <Modal isOpen={isOpen} onClose={close} title="Media library" size="lg">
        <div className="flex flex-col gap-5">
          {hint && <p className="text-sm text-ink-soft">{hint}</p>}

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border-2 border-dashed border-beige-dark p-4">
            <div className="flex items-center gap-3">
              <Upload size={20} className="text-ink-soft" />
              <div>
                <p className="text-sm font-medium text-ink">Upload a new image</p>
                <p className="text-xs text-ink-soft">Up to {formatBytes(MAX_ASSET_SOURCE_BYTES)} per image.</p>
              </div>
            </div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              isLoading={isUploading}
              onClick={() => fileInputRef.current?.click()}
            >
              Upload
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

          {uploadError && (
            <p role="alert" className="text-sm text-error">
              {uploadError}
            </p>
          )}

          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-ink">Your library</p>
            {status === "loading" ? (
              <p className="text-sm text-ink-soft">Loading images...</p>
            ) : status === "error" ? (
              <p role="alert" className="text-sm text-error">
                Couldn't load your media library. Try closing and reopening this dialog.
              </p>
            ) : assets.length === 0 ? (
              <p className="text-sm text-ink-soft">No images uploaded yet.</p>
            ) : (
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                {assets.map((asset) => (
                  <AssetTile
                    key={asset.id}
                    src={asset.url}
                    name={asset.name}
                    isSelected={value === asset.url}
                    onSelect={() => selectAsset(asset.url)}
                    onDelete={() => remove(asset.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}

function AssetTile({
  src,
  name,
  isSelected,
  onSelect,
  onDelete,
}: {
  src: string;
  name: string;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}): ReactNode {
  return (
    <div className="group relative">
      <button
        type="button"
        onClick={onSelect}
        aria-label={`Use ${name}`}
        className={cn(
          "aspect-square w-full overflow-hidden rounded-md border-2 bg-beige/40",
          isSelected ? "border-denim" : "border-beige hover:border-denim/60",
        )}
      >
        <img src={src} alt={name} className="h-full w-full object-cover" />
        {isSelected && (
          <span className="absolute right-1 top-1 rounded-full bg-denim p-1 text-surface">
            <Check size={12} />
          </span>
        )}
      </button>
      <button
        type="button"
        onClick={onDelete}
        aria-label={`Delete ${name}`}
        className="absolute -right-1.5 -top-1.5 rounded-full bg-error p-1 text-surface opacity-0 shadow-soft transition-opacity group-hover:opacity-100"
      >
        <Trash2 size={12} />
      </button>
    </div>
  );
}
