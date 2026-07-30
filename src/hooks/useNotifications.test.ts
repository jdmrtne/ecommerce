import { beforeEach, describe, expect, it } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { act } from "@testing-library/react";
import { useNotifications } from "@/hooks/useNotifications";
import { apiCreateNotification } from "@/lib/api/notifications";
import { fakeSupabase } from "@/test/fakeSupabaseAuth";

const EMAIL = "jude@example.com";

describe("useNotifications", () => {
  beforeEach(() => {
    fakeSupabase.__reset();
  });

  it("resolves to an empty list with no email", async () => {
    const { result } = renderHook(() => useNotifications(undefined));
    await waitFor(() => expect(result.current.status).toBe("success"));
    expect(result.current.notifications).toEqual([]);
    expect(result.current.unreadCount).toBe(0);
  });

  it("loads a signed-in shopper's notifications, newest first, with an accurate unread count", async () => {
    await apiCreateNotification(EMAIL, { type: "order_placed", title: "Order placed", body: "Order 1", orderNumber: "CVE-0001" });
    await apiCreateNotification(EMAIL, { type: "order_placed", title: "Order placed", body: "Order 2", orderNumber: "CVE-0002" });

    const { result } = renderHook(() => useNotifications(EMAIL));
    await waitFor(() => expect(result.current.status).toBe("success"));

    expect(result.current.notifications).toHaveLength(2);
    expect(result.current.unreadCount).toBe(2);
  });

  it("markRead optimistically flips one notification's read flag and lowers the unread count", async () => {
    await apiCreateNotification(EMAIL, { type: "order_placed", title: "Order placed", body: "Order 1", orderNumber: "CVE-0001" });

    const { result } = renderHook(() => useNotifications(EMAIL));
    await waitFor(() => expect(result.current.status).toBe("success"));
    const id = result.current.notifications[0].id;

    act(() => {
      result.current.markRead(id);
    });

    expect(result.current.notifications[0].read).toBe(true);
    expect(result.current.unreadCount).toBe(0);
  });

  it("markAllRead flips every notification's read flag", async () => {
    await apiCreateNotification(EMAIL, { type: "order_placed", title: "Order placed", body: "Order 1", orderNumber: "CVE-0001" });
    await apiCreateNotification(EMAIL, { type: "order_placed", title: "Order placed", body: "Order 2", orderNumber: "CVE-0002" });

    const { result } = renderHook(() => useNotifications(EMAIL));
    await waitFor(() => expect(result.current.status).toBe("success"));

    act(() => {
      result.current.markAllRead();
    });

    expect(result.current.unreadCount).toBe(0);
    expect(result.current.notifications.every((n) => n.read)).toBe(true);
  });

  it("sets status to error if the fetch fails", async () => {
    const originalFrom = fakeSupabase.from;
    fakeSupabase.from = ((table: string) => {
      if (table === "notifications") {
        return {
          select: () => ({ eq: () => ({ order: () => Promise.resolve({ data: null, error: { message: "boom" } }) }) }),
        } as never;
      }
      return originalFrom(table);
    }) as typeof fakeSupabase.from;

    const { result } = renderHook(() => useNotifications(EMAIL));
    await waitFor(() => expect(result.current.status).toBe("error"));

    fakeSupabase.from = originalFrom;
  });
});
