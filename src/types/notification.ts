/**
 * Phase 33 - Notifications. Currently only one event triggers a
 * notification (order placement, per this phase's scope), but `type` is
 * a string union rather than a boolean so a future phase (account
 * created, etc, per `ROADMAP.md`'s original "key events" framing) can
 * add a case without a schema change - `notifications.type` is a plain
 * `text` column in `supabase/schema.sql`, not a constrained enum.
 */
export type NotificationType = "order_placed";

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  /** The order this notification is about, if any - lets a click-through link to /account. */
  orderNumber?: string;
  read: boolean;
  /** ISO date string. */
  createdAt: string;
}

/** Fields needed to create a notification - id/read/createdAt are assigned by the database/insert. */
export type NewNotification = Pick<AppNotification, "type" | "title" | "body" | "orderNumber">;
