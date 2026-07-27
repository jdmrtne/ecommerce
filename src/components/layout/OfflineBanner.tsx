import { WifiOff } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";

/** Slim sticky banner that appears whenever the browser goes offline. */
export function OfflineBanner() {
  const isOnline = useOnlineStatus();

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="sticky top-0 z-50 flex items-center justify-center gap-2 overflow-hidden bg-error px-4 py-2 text-sm font-medium text-surface"
        >
          <WifiOff size={16} />
          You're offline. Some features may not work until you're back online.
        </motion.div>
      )}
    </AnimatePresence>
  );
}
