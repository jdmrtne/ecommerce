import { beforeEach, describe, expect, it } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useCustomers } from "@/hooks/useCustomers";
import { fakeSupabase } from "@/test/fakeSupabaseAuth";

const CUSTOMER = { id: "fake-user-1", email: "jude@example.com", name: "Jude Tambago", role: "customer" as const };
const ADMIN = { id: "fake-user-2", email: "admin@example.com", name: "Admin Account", role: "admin" as const };

describe("useCustomers", () => {
  beforeEach(() => {
    fakeSupabase.__reset();
  });

  it("starts loading, then resolves to every registered profile", async () => {
    fakeSupabase.__seedProfile(CUSTOMER, "unused");
    fakeSupabase.__seedProfile(ADMIN, "unused");

    const { result } = renderHook(() => useCustomers());
    expect(result.current.status).toBe("loading");

    await waitFor(() => expect(result.current.status).toBe("success"));
    expect(result.current.customers).toHaveLength(2);
    expect(result.current.customers.map((c) => c.email)).toEqual(
      expect.arrayContaining([CUSTOMER.email, ADMIN.email]),
    );
  });

  it("resolves to an empty list when no one has registered", async () => {
    const { result } = renderHook(() => useCustomers());
    await waitFor(() => expect(result.current.status).toBe("success"));
    expect(result.current.customers).toHaveLength(0);
  });

  it("sets status to error if the fetch fails", async () => {
    const originalFrom = fakeSupabase.from;
    fakeSupabase.from = ((table: string) => {
      if (table === "profiles") {
        return {
          select: () => ({ order: () => Promise.resolve({ data: null, error: { message: "boom" } }) }),
        } as never;
      }
      return originalFrom(table);
    }) as typeof fakeSupabase.from;

    const { result } = renderHook(() => useCustomers());
    await waitFor(() => expect(result.current.status).toBe("error"));

    fakeSupabase.from = originalFrom;
  });
});
