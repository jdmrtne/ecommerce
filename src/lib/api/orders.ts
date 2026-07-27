import type { SupabaseClient } from "@supabase/supabase-js";
import type { Order } from "@/types/order";
import { supabase } from "@/lib/api/client";
import { mapOrderRow, toOrderRow } from "@/lib/api/types";
import type { OrderRow } from "@/lib/api/types";

/**
 * Phase 25 - Backend Integration. Same function names/shapes as
 * `lib/orders.ts`'s `getOrdersForUser()`/`saveOrderForUser()`, backed by
 * the `orders` table instead of a per-user `localStorage` key. Orders are
 * insert-only here (an order, once placed, is never edited by this app),
 * matching `saveOrderForUser`'s "append to history" behavior.
 */

export async function apiGetOrdersForUser(email: string, client: SupabaseClient = supabase): Promise<Order[]> {
  const { data, error } = await client
    .from("orders")
    .select("*")
    .eq("user_email", email.toLowerCase())
    .order("placed_at", { ascending: false });
  if (error) throw new Error(error.message);
  return ((data ?? []) as OrderRow[]).map(mapOrderRow);
}

export async function apiSaveOrderForUser(email: string, order: Order, client: SupabaseClient = supabase): Promise<void> {
  const { error } = await client.from("orders").insert(toOrderRow(email, order));
  if (error) throw new Error(error.message);
}
