import { useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

interface LightboxProps {
  isOpen: boolean;
  onClose: () => void;
  images: string[];
  index: number;
  onIndexChange: (index: number) => void;
  alt: string;
}

/**
 * Full-bleed image lightbox. Deliberately not built on top of `Modal` -
 * there's no card, no title bar, no surface background. Just the backdrop,
 * the image, and (when there's more than one) prev/next controls. Escape
 * and backdrop click close it; left/right arrow keys navigate.
 */
export function Lightbox({ isOpen, onClose, images, index, onIndexChange, alt }: LightboxProps) {
  const hasMultiple = images.length > 1;

  const goPrev = useCallback(() => {
    onIndexChange((index - 1 + images.length) % images.length);
  }, [index, images.length, onIndexChange]);

  const goNext = useCallback(() => {
    onIndexChange((index + 1) % images.length);
  }, [index, images.length, onIndexChange]);

  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (hasMultiple && e.key === "ArrowLeft") goPrev();
      if (hasMultiple && e.key === "ArrowRight") goNext();
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose, hasMultiple, goPrev, goNext]);

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-label={alt}
          tabIndex={-1}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/95"
          onClick={onClose}
        >
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute right-4 top-4 z-10 rounded-full p-2 text-surface/80 transition-colors hover:bg-surface/10 hover:text-surface"
          >
            <X size={26} />
          </button>

          {hasMultiple && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  goPrev();
                }}
                aria-label="Previous image"
                className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full p-2 text-surface/80 transition-colors hover:bg-surface/10 hover:text-surface sm:left-4"
              >
                <ChevronLeft size={32} />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  goNext();
                }}
                aria-label="Next image"
                className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full p-2 text-surface/80 transition-colors hover:bg-surface/10 hover:text-surface sm:right-4"
              >
                <ChevronRight size={32} />
              </button>
            </>
          )}

          <motion.img
            key={images[index]}
            src={images[index]}
            alt={alt}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[85vh] w-auto max-w-[90vw] rounded-md object-contain"
          />

          {hasMultiple && (
            <span
              className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-ink/50 px-3 py-1 text-xs font-medium text-surface"
              aria-hidden="true"
            >
              {index + 1} / {images.length}
            </span>
          )}
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
