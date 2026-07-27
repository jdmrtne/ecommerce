import { describe, expect, it } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { Route, Routes } from "react-router-dom";
import { RequireAdmin } from "@/components/auth/RequireAdmin";
import { renderWithProviders } from "@/test/utils";
import { fakeSupabase } from "@/test/fakeSupabaseAuth";
import type { ProfileRow } from "@/lib/api/types";

function Protected() {
  return <p>Secret admin content</p>;
}

function LoginStub() {
  return <p>Login page</p>;
}

function TestApp() {
  return (
    <Routes>
      <Route path="/login" element={<LoginStub />} />
      <Route
        path="/admin"
        element={
          <RequireAdmin>
            <Protected />
          </RequireAdmin>
        }
      />
    </Routes>
  );
}

function seedSession(role: "admin" | "customer") {
  const email = role === "admin" ? "boss@example.com" : "shopper@example.com";
  const profile: ProfileRow = { id: `seed-${role}`, email, name: "Test User", role };
  fakeSupabase.__signInAs(profile);
}

describe("RequireAdmin", () => {
  it("redirects an unauthenticated visitor to /login", async () => {
    renderWithProviders(<TestApp />, ["/admin"]);
    expect(await screen.findByText("Login page")).toBeInTheDocument();
    expect(screen.queryByText("Secret admin content")).not.toBeInTheDocument();
  });

  it("shows an access-denied panel for a signed-in non-admin account", async () => {
    seedSession("customer");
    renderWithProviders(<TestApp />, ["/admin"]);
    expect(await screen.findByText("Admin access required")).toBeInTheDocument();
    expect(screen.queryByText("Secret admin content")).not.toBeInTheDocument();
    expect(screen.queryByText("Login page")).not.toBeInTheDocument();
  });

  it("renders the protected content for a signed-in admin account", async () => {
    seedSession("admin");
    renderWithProviders(<TestApp />, ["/admin"]);
    await waitFor(() => expect(screen.getByText("Secret admin content")).toBeInTheDocument());
  });
});
