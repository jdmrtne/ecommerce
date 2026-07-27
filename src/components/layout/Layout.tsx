import { Outlet } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { OfflineBanner } from "@/components/layout/OfflineBanner";
import { ErrorBoundary } from "@/components/ErrorBoundary";

/** App shell rendered around every route via React Router's <Outlet />. */
export function Layout() {
  return (
    <div className="flex min-h-screen flex-col bg-cream">
      <OfflineBanner />
      <Navbar />
      <main className="flex-1">
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>
      <Footer />
    </div>
  );
}
