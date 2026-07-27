import { describe, expect, it } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router-dom";
import { Login } from "@/pages/Login";
import { renderWithProviders } from "@/test/utils";
import { fakeSupabase } from "@/test/fakeSupabaseAuth";

function TestApp() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/account" element={<p>Account page</p>} />
    </Routes>
  );
}

describe("Login page", () => {
  it("shows a validation error instead of submitting an invalid login", async () => {
    const user = userEvent.setup();
    renderWithProviders(<TestApp />, ["/login"]);

    await user.click(screen.getByRole("button", { name: "Log in" }));

    expect(await screen.findByText("Please enter a valid email address.")).toBeInTheDocument();
    // Still on the login form, not redirected.
    expect(screen.getByRole("heading", { name: "Log in" })).toBeInTheDocument();
  });

  it("toggles to the signup form and back", async () => {
    const user = userEvent.setup();
    renderWithProviders(<TestApp />, ["/login"]);

    await user.click(screen.getByRole("button", { name: "Sign up" }));
    expect(screen.getByRole("heading", { name: "Create your account" })).toBeInTheDocument();
    expect(screen.getByLabelText("Full name")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Log in" }));
    expect(screen.getByRole("heading", { name: "Log in" })).toBeInTheDocument();
  });

  it("signs up successfully and redirects to /account", async () => {
    const user = userEvent.setup();
    renderWithProviders(<TestApp />, ["/login"]);

    await user.click(screen.getByRole("button", { name: "Sign up" }));
    await user.type(screen.getByLabelText("Full name"), "Jude Tambago");
    await user.type(screen.getByLabelText("Email"), "jude@example.com");
    await user.type(screen.getByLabelText("Password"), "secret123");
    await user.type(screen.getByLabelText("Confirm password"), "secret123");
    await user.click(screen.getByRole("button", { name: "Create account" }));

    await waitFor(() => expect(screen.getByText("Account page")).toBeInTheDocument(), {
      timeout: 2000,
    });
  });

  it("shows an inline error for a mismatched confirm-password without submitting", async () => {
    const user = userEvent.setup();
    renderWithProviders(<TestApp />, ["/login"]);

    await user.click(screen.getByRole("button", { name: "Sign up" }));
    await user.type(screen.getByLabelText("Full name"), "Jude Tambago");
    await user.type(screen.getByLabelText("Email"), "jude@example.com");
    await user.type(screen.getByLabelText("Password"), "secret123");
    await user.type(screen.getByLabelText("Confirm password"), "different1");
    await user.click(screen.getByRole("button", { name: "Create account" }));

    expect(await screen.findByText("Passwords don't match.")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Create your account" })).toBeInTheDocument();
  });

  it("shows a server-style error for a wrong password on an existing account", async () => {
    const user = userEvent.setup();
    // Pre-seed an account the way the real backend would already have one.
    fakeSupabase.__seedProfile({ id: "seed-jude", email: "jude@example.com", name: "Jude", role: "customer" }, "secret123");

    renderWithProviders(<TestApp />, ["/login"]);
    await user.type(screen.getByLabelText("Email"), "jude@example.com");
    await user.type(screen.getByLabelText("Password"), "wrong-password");
    await user.click(screen.getByRole("button", { name: "Log in" }));

    expect(await screen.findByText("Invalid login credentials")).toBeInTheDocument();
  });
});
