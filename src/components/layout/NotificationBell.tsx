import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { useNotifications } from "@/hooks/useNotifications";
import { cn } from "@/lib/cn";

/**
 * Phase 33 - Notifications. The in-app half of order-confirmation
 * notifications (see `lib/notifications/notify.ts` for the write side).
 * Only rendered for a signed-in shopper - `Navbar.tsx` mounts this
 * inside its `isAuthenticated` branches, same as the existing Account
 * icon. A small self-contained dropdown (not `Modal.tsx`'s full-screen
 * overlay, and not a dedicated page - a glanceable list fits a
 * lightweight anchored panel better, closer in spirit to `CartDrawer`
 * but anchored under the bell rather than a full-height side panel).
 *
 * Opening the panel does not itself mark anything read - a shopper
 * should be able to glance at the list before committing to "read", so
 * marking happens per-notification (clicking one) or all at once (the
 * "Mark all as read" button), same optimistic-then-sync approach
 * `useNotifications` already implements.
 */
export function NotificationBell() {
  const { user, isAuthenticated } = useAuth();
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications(user?.email);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  if (!isAuthenticated) return null;

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setIsOpen((v) => !v)}
        aria-label="Notifications"
        aria-expanded={isOpen}
        className="relative rounded-full p-2 text-ink transition-colors hover:bg-beige hover:text-denim"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-bloom text-[10px] font-bold text-surface">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            role="dialog"
            aria-label="Notifications"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full z-50 mt-2 w-80 max-w-[90vw] rounded-md border border-beige bg-surface shadow-soft"
          >
            <div className="flex items-center justify-between border-b border-beige px-4 py-3">
              <span className="font-display text-base text-ink">Notifications</span>
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllRead()}
                  className="text-xs font-semibold text-denim hover:underline"
                >
                  Mark all as read
                </button>
              )}
            </div>
            <ul className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <li className="px-4 py-6 text-center text-sm text-ink-soft">No notifications yet.</li>
              ) : (
                notifications.map((notification) => (
                  <li key={notification.id}>
                    <button
                      onClick={() => markRead(notification.id)}
                      className={cn(
                        "flex w-full flex-col items-start gap-0.5 border-b border-beige/60 px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-beige/50",
                        !notification.read && "bg-denim-tint/30",
                      )}
                    >
                      <span className="flex w-full items-center gap-2">
                        {!notification.read && <span className="h-2 w-2 shrink-0 rounded-full bg-bloom" aria-hidden="true" />}
                        <span className="font-semibold text-ink">{notification.title}</span>
                      </span>
                      <span className="text-sm text-ink-soft">{notification.body}</span>
                    </button>
                  </li>
                ))
              )}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
