import { describe, expect, it } from "vitest";
import {
  apiCreateNotification,
  apiGetNotificationsForUser,
  apiMarkAllNotificationsRead,
  apiMarkNotificationRead,
} from "@/lib/api/notifications";
import { chainableResult, createMockSupabaseClient } from "@/test/mockSupabaseClient";
import type { NotificationRow } from "@/lib/api/types";

const ROW: NotificationRow = {
  id: "notif-1",
  user_email: "jude@example.com",
  type: "order_placed",
  title: "Order placed",
  body: "Your order CVE-0001 has been placed and is being processed.",
  order_number: "CVE-0001",
  read: false,
  created_at: "2026-01-01T00:00:00.000Z",
};

describe("lib/api/notifications", () => {
  it("apiGetNotificationsForUser filters by lowercased email and orders newest-first", async () => {
    const chain = chainableResult({ data: [ROW], error: null });
    const client = createMockSupabaseClient(chain);

    const notifications = await apiGetNotificationsForUser("Jude@Example.com", client);

    expect(client.from).toHaveBeenCalledWith("notifications");
    expect(chain.eq).toHaveBeenCalledWith("user_email", "jude@example.com");
    expect(chain.order).toHaveBeenCalledWith("created_at", { ascending: false });
    expect(notifications).toEqual([
      {
        id: "notif-1",
        type: "order_placed",
        title: "Order placed",
        body: "Your order CVE-0001 has been placed and is being processed.",
        orderNumber: "CVE-0001",
        read: false,
        createdAt: "2026-01-01T00:00:00.000Z",
      },
    ]);
  });

  it("apiGetNotificationsForUser returns an empty array when there are no rows", async () => {
    const client = createMockSupabaseClient(chainableResult({ data: null, error: null }));
    expect(await apiGetNotificationsForUser("jude@example.com", client)).toEqual([]);
  });

  it("apiGetNotificationsForUser throws with the Supabase error message on failure", async () => {
    const client = createMockSupabaseClient(chainableResult({ data: null, error: { message: "denied" } }));
    await expect(apiGetNotificationsForUser("jude@example.com", client)).rejects.toThrow("denied");
  });

  it("apiCreateNotification inserts the mapped row", async () => {
    const chain = chainableResult({ data: null, error: null });
    const client = createMockSupabaseClient(chain);

    await apiCreateNotification(
      "Jude@Example.com",
      { type: "order_placed", title: "Order placed", body: "...", orderNumber: "CVE-0001" },
      client,
    );

    expect(client.from).toHaveBeenCalledWith("notifications");
    expect(chain.insert).toHaveBeenCalledWith(
      expect.objectContaining({ user_email: "jude@example.com", type: "order_placed", order_number: "CVE-0001" }),
    );
  });

  it("apiCreateNotification throws with the Supabase error message on failure", async () => {
    const client = createMockSupabaseClient(chainableResult({ data: null, error: { message: "RLS denied" } }));
    await expect(
      apiCreateNotification("jude@example.com", { type: "order_placed", title: "t", body: "b" }, client),
    ).rejects.toThrow("RLS denied");
  });

  it("apiMarkNotificationRead updates the row by id", async () => {
    const chain = chainableResult({ data: null, error: null });
    const client = createMockSupabaseClient(chain);

    await apiMarkNotificationRead("notif-1", client);

    expect(client.from).toHaveBeenCalledWith("notifications");
    expect(chain.update).toHaveBeenCalledWith({ read: true });
    expect(chain.eq).toHaveBeenCalledWith("id", "notif-1");
  });

  it("apiMarkNotificationRead throws with the Supabase error message on failure", async () => {
    const client = createMockSupabaseClient(chainableResult({ data: null, error: { message: "denied" } }));
    await expect(apiMarkNotificationRead("notif-1", client)).rejects.toThrow("denied");
  });

  it("apiMarkAllNotificationsRead updates every row for the lowercased email", async () => {
    const chain = chainableResult({ data: null, error: null });
    const client = createMockSupabaseClient(chain);

    await apiMarkAllNotificationsRead("Jude@Example.com", client);

    expect(chain.update).toHaveBeenCalledWith({ read: true });
    expect(chain.eq).toHaveBeenCalledWith("user_email", "jude@example.com");
  });

  it("apiMarkAllNotificationsRead throws with the Supabase error message on failure", async () => {
    const client = createMockSupabaseClient(chainableResult({ data: null, error: { message: "denied" } }));
    await expect(apiMarkAllNotificationsRead("jude@example.com", client)).rejects.toThrow("denied");
  });
});
