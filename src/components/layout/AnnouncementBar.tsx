import { useState } from "react";
import { Link } from "react-router-dom";
import { X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { ANNOUNCEMENT } from "@/content/homepage";
import { storageKey } from "@/config/branding";

/**
 * Site-wide announcement banner, driven entirely by `ANNOUNCEMENT` in
 * `src/content/homepage.ts` - set `enabled: true` there and fill in
 * `message` (and optionally `linkLabel`/`linkTo`) to show it, with no
 * component change needed. Renders nothing when `enabled` is false.
 *
 * Dismissal is remembered per browser via localStorage (namespaced with
 * `storageKey`, same convention as cart/wishlist/theme), keyed off the
 * announcement's own message so editing the message text automatically
 * re-shows the banner to everyone who already dismissed the old one.
 */
export function AnnouncementBar() {
  const dismissKey = storageKey(`announcement-dismissed-${ANNOUNCEMENT.message}`);
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(dismissKey) === "1";
  });

  if (!ANNOUNCEMENT.enabled || !ANNOUNCEMENT.message) return null;

  function handleDismiss() {
    window.localStorage.setItem(dismissKey, "1");
    setDismissed(true);
  }

  return (
    <AnimatePresence>
      {!dismissed && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="relative flex items-center justify-center gap-2 overflow-hidden bg-denim px-10 py-2 text-center text-sm font-medium text-surface"
        >
          <span>
            {ANNOUNCEMENT.message}
            {ANNOUNCEMENT.linkLabel && ANNOUNCEMENT.linkTo && (
              <Link to={ANNOUNCEMENT.linkTo} className="ml-2 underline underline-offset-2 hover:no-underline">
                {ANNOUNCEMENT.linkLabel}
              </Link>
            )}
          </span>
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Dismiss announcement"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-surface/80 hover:text-surface"
          >
            <X size={14} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
