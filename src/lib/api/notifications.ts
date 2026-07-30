import type { SupabaseClient } from "@supabase/supabase-js";
import type { AppNotification, NewNotification } from "@/types/notification";
import { supabase } from "@/lib/api/client";
import { mapNotificationRow, toNewNotificationRow } from "@/lib/api/types";
import type { NotificationRow } from "@/lib/api/types";

/**
 * Phase 33 - Notifications. Same shape as `lib/api/orders.ts` - injectable
 * `client`, defaulting to the real singleton, so every function here is
 * network-free in tests (see `notifications.test.ts` /
 * `src/test/mockSupabaseClient.ts`). Only a signed-in shopper ever has
 * notifications (guest checkouts have no owner row to write one for -
 * see `supabase/schema.sql`'s RLS policies), so every function here
 * takes an `email`, same convention `apiGetOrdersForUser`/
 * `apiSaveOrderForUser` already use.
 */

export async function apiGetNotificationsForUser(email: string, client: SupabaseClient = supabase): Promise<AppNotification[]> {
  const { data, error } = await client
    .from("notifications")
    .select("*")
    .eq("user_email", email.toLowerCase())
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return ((data ?? []) as NotificationRow[]).map(mapNotificationRow);
}

export async function apiCreateNotification(
  email: string,
  notification: NewNotification,
  client: SupabaseClient = supabase,
): Promise<void> {
  const { error } = await client.from("notifications").insert(toNewNotificationRow(email, notification));
  if (error) throw new Error(error.message);
}

export async function apiMarkNotificationRead(id: string, client: SupabaseClient = supabase): Promise<void> {
  const { error } = await client.from("notifications").update({ read: true }).eq("id", id);
  if (error) throw new Error(error.message);
}

/** Marks every one of this shopper's notifications read at once (the bell dropdown's "Mark all as read"). */
export async function apiMarkAllNotificationsRead(email: string, client: SupabaseClient = supabase): Promise<void> {
  const { error } = await client.from("notifications").update({ read: true }).eq("user_email", email.toLowerCase());
  if (error) throw new Error(error.message);
}
