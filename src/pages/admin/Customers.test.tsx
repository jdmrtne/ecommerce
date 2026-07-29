import { beforeEach, describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Customers } from "@/pages/admin/Customers";
import { renderWithProviders } from "@/test/utils";
import { fakeSupabase } from "@/test/fakeSupabaseAuth";

const CUSTOMER = { id: "fake-user-1", email: "jude@example.com", name: "Jude Tambago", role: "customer" as const };
const ADMIN = { id: "fake-user-2", email: "amara@example.com", name: "Amara Cruz", role: "admin" as const };

describe("Customers", () => {
  beforeEach(() => {
    fakeSupabase.__reset();
  });

  it("sets the page title", () => {
    renderWithProviders(<Customers />);
    expect(document.title).toContain("Customers");
  });

  it("shows a loading state, then lists every registered customer", async () => {
    fakeSupabase.__seedProfile(CUSTOMER, "unused");
    fakeSupabase.__seedProfile(ADMIN, "unused");

    renderWithProviders(<Customers />);
    expect(screen.getByTestId("customer-list").querySelectorAll('[aria-hidden="true"]').length).toBeGreaterThan(0);

    await screen.findByText("2 of 2 customers");
    expect(screen.getByText(CUSTOMER.name)).toBeInTheDocument();
    expect(screen.getByText(ADMIN.name)).toBeInTheDocument();
  });

  it("shows an empty state when no one has registered", async () => {
    renderWithProviders(<Customers />);
    await screen.findByText("No customers yet");
  });

  it("filters the list by search query", async () => {
    const user = userEvent.setup();
    fakeSupabase.__seedProfile(CUSTOMER, "unused");
    fakeSupabase.__seedProfile(ADMIN, "unused");

    renderWithProviders(<Customers />);
    await screen.findByText("2 of 2 customers");

    await user.type(screen.getByLabelText("Search customers"), "jude");
    expect(screen.getByText("1 of 2 customers")).toBeInTheDocument();
    expect(screen.getByText(CUSTOMER.name)).toBeInTheDocument();
    expect(screen.queryByText(ADMIN.name)).not.toBeInTheDocument();
  });

  it("filters the list by role", async () => {
    const user = userEvent.setup();
    fakeSupabase.__seedProfile(CUSTOMER, "unused");
    fakeSupabase.__seedProfile(ADMIN, "unused");

    renderWithProviders(<Customers />);
    await screen.findByText("2 of 2 customers");

    await user.selectOptions(screen.getByLabelText("Filter by role"), "admin");
    expect(screen.getByText("1 of 2 customers")).toBeInTheDocument();
    expect(screen.getByText(ADMIN.name)).toBeInTheDocument();
    expect(screen.queryByText(CUSTOMER.name)).not.toBeInTheDocument();
  });

  it("links each row to that customer's detail page", async () => {
    fakeSupabase.__seedProfile(CUSTOMER, "unused");

    renderWithProviders(<Customers />);
    await screen.findByText("1 of 1 customer");

    expect(screen.getByRole("link", { name: new RegExp(CUSTOMER.name) })).toHaveAttribute(
      "href",
      `/admin/customers/${encodeURIComponent(CUSTOMER.email)}`,
    );
  });

  it("shows an error state with a retry action if the customer list fails to load", async () => {
    const originalFrom = fakeSupabase.from;
    fakeSupabase.from = ((table: string) => {
      if (table === "profiles") {
        return {
          select: () => ({ order: () => Promise.resolve({ data: null, error: { message: "network down" } }) }),
        } as never;
      }
      return originalFrom(table);
    }) as typeof fakeSupabase.from;

    renderWithProviders(<Customers />);
    await screen.findByText("Couldn't load customers");

    fakeSupabase.from = originalFrom;
    fakeSupabase.__seedProfile(CUSTOMER, "unused");
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /retry/i }));
    await screen.findByText("1 of 1 customer");
  });
});
