import { beforeEach, describe, expect, it } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NotificationBell } from "@/components/layout/NotificationBell";
import { renderWithProviders } from "@/test/utils";
import { fakeSupabase } from "@/test/fakeSupabaseAuth";
import { apiCreateNotification } from "@/lib/api/notifications";

const PROFILE = { id: "fake-user-1", email: "jude@example.com", name: "Jude Tambago", role: "customer" as const };

describe("NotificationBell", () => {
  beforeEach(() => {
    fakeSupabase.__reset();
  });

  it("renders nothing when signed out", () => {
    renderWithProviders(<NotificationBell />);
    expect(screen.queryByLabelText("Notifications")).not.toBeInTheDocument();
  });

  it("shows an unread badge and lists notifications for a signed-in shopper", async () => {
    fakeSupabase.__signInAs(PROFILE);
    await apiCreateNotification(PROFILE.email, {
      type: "order_placed",
      title: "Order placed",
      body: "Your order CVE-0001 has been placed and is being processed.",
      orderNumber: "CVE-0001",
    });

    renderWithProviders(<NotificationBell />);

    await waitFor(() => expect(screen.getByLabelText("Notifications")).toBeInTheDocument());
    await waitFor(() => expect(screen.getByText("1")).toBeInTheDocument());

    const user = userEvent.setup();
    await user.click(screen.getByLabelText("Notifications"));

    expect(await screen.findByText("Order placed")).toBeInTheDocument();
    expect(screen.getByText(/CVE-0001 has been placed/)).toBeInTheDocument();
  });

  it("shows an empty state with no notifications", async () => {
    fakeSupabase.__signInAs(PROFILE);
    renderWithProviders(<NotificationBell />);

    const user = userEvent.setup();
    await user.click(await screen.findByLabelText("Notifications"));

    expect(await screen.findByText("No notifications yet.")).toBeInTheDocument();
  });

  it("marking a notification read clears the unread badge", async () => {
    fakeSupabase.__signInAs(PROFILE);
    await apiCreateNotification(PROFILE.email, {
      type: "order_placed",
      title: "Order placed",
      body: "Your order CVE-0001 has been placed.",
      orderNumber: "CVE-0001",
    });

    renderWithProviders(<NotificationBell />);
    const user = userEvent.setup();
    await user.click(await screen.findByLabelText("Notifications"));

    await user.click(await screen.findByText("Order placed"));

    await waitFor(() => expect(screen.queryByText("1")).not.toBeInTheDocument());
  });
});
