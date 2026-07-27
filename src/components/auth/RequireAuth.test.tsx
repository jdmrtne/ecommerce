import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { Route, Routes } from "react-router-dom";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { renderWithProviders } from "@/test/utils";

function Protected() {
  return <p>Secret account content</p>;
}

function LoginStub() {
  return <p>Login page</p>;
}

function TestApp() {
  return (
    <Routes>
      <Route path="/login" element={<LoginStub />} />
      <Route
        path="/account"
        element={
          <RequireAuth>
            <Protected />
          </RequireAuth>
        }
      />
    </Routes>
  );
}

describe("RequireAuth", () => {
  it("redirects an unauthenticated visitor to /login", async () => {
    renderWithProviders(<TestApp />, ["/account"]);
    expect(await screen.findByText("Login page")).toBeInTheDocument();
    expect(screen.queryByText("Secret account content")).not.toBeInTheDocument();
  });
});
