import "@testing-library/jest-dom/vitest";
import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import { fakeSupabase } from "@/test/fakeSupabaseAuth";

/**
 * Phase 26 - Authentication (Backend-Integrated). `AuthProvider` now
 * talks to the real `supabase` singleton from `@/lib/api/client`
 * (real network, real env vars) - every test that mounts it (directly,
 * or transitively via `renderWithProviders`/`App`) needs that singleton
 * replaced with something that works with no network and no `.env`.
 * This mock is global (here in setupFiles, not per-test-file) because
 * `AuthProvider` is mounted by dozens of unrelated component tests, not
 * just its own - see `src/test/fakeSupabaseAuth.ts`'s doc comment for
 * why the fake itself has to behave like a real backend across a whole
 * journey rather than return one canned response.
 */
vi.mock("@/lib/api/client", () => ({ supabase: fakeSupabase }));

// jsdom doesn't implement IntersectionObserver. `useInView` (used by several
// homepage sections - Categories, BestSellers, AboutBrand, Testimonials) reads
// it on mount, so any test that renders one of those needs a stand-in. No
// prior test rendered a full page composed of these sections, so this gap
// went unnoticed until Phase 10's Home.test.tsx did.
class MockIntersectionObserver {
  observe = () => {};
  unobserve = () => {};
  disconnect = () => {};
  takeRecords = () => [];
}

vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);

// Every provider in this app (Cart/Wishlist/Auth) reads and writes
// localStorage, so tests must start from a clean slate each time -
// otherwise state written in one test (e.g. a signed-up user, a saved
// cart) would leak into the next and produce order-dependent failures.
afterEach(() => {
  cleanup();
  window.localStorage.clear();
  fakeSupabase.__reset();
});
