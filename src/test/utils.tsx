import type { ReactElement, ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";
import { render } from "@testing-library/react";
import { CartProvider } from "@/context/CartProvider";
import { WishlistProvider } from "@/context/WishlistProvider";
import { AuthProvider } from "@/context/AuthProvider";

/**
 * Wraps children in every context provider App.tsx mounts, plus a
 * MemoryRouter so components using react-router hooks (useLocation,
 * useNavigate, <Navigate>) work in isolation from a real browser URL.
 * `initialEntries` lets a test start on a specific route (e.g. "/account").
 */
export function AllProviders({
  children,
  initialEntries = ["/"],
}: {
  children: ReactNode;
  initialEntries?: string[];
}) {
  return (
    <MemoryRouter initialEntries={initialEntries}>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>{children}</WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </MemoryRouter>
  );
}

/** Renders a component under every provider, for tests that need more than one context. */
export function renderWithProviders(ui: ReactElement, initialEntries?: string[]) {
  return render(<AllProviders initialEntries={initialEntries}>{ui}</AllProviders>);
}
