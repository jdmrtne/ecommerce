import { useCallback, useEffect, useMemo, useState } from "react";
import { apiGetNotificationsForUser, apiMarkAllNotificationsRead, apiMarkNotificationRead } from "@/lib/api/notifications";
import type { AppNotification } from "@/types/notification";

export type NotificationsStatus = "loading" | "success" | "error";

/**
 * Phase 33 - Notifications. Same `{ data, status, reload }` shape
 * `hooks/useOrders.ts` established for a per-user backend read - loading/
 * success/error, with a `reload()` a caller can hand an `ErrorState`'s
 * retry action. `markRead`/`markAllRead` optimistically flip the local
 * list's `read` flag before the network call resolves (a notification
 * bell should feel instant), then reload from the server in the
 * background to stay in sync - if the write actually fails, the next
 * poll/reload corrects it rather than the UI silently lying forever.
 */
export function useNotifications(email: string | undefined) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [status, setStatus] = useState<NotificationsStatus>("loading");

  const load = useCallback(() => {
    if (!email) {
      setNotifications([]);
      setStatus("success");
      return;
    }
    setStatus("loading");
    apiGetNotificationsForUser(email)
      .then((data) => {
        setNotifications(data);
        setStatus("success");
      })
      .catch(() => setStatus("error"));
  }, [email]);

  useEffect(() => {
    load();
  }, [load]);

  const markRead = useCallback(
    (id: string) => {
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
      apiMarkNotificationRead(id).catch(() => load());
    },
    [load],
  );

  const markAllRead = useCallback(() => {
    if (!email) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    apiMarkAllNotificationsRead(email).catch(() => load());
  }, [email, load]);

  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);

  return { notifications, unreadCount, status, reload: load, markRead, markAllRead };
}
