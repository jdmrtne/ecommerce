import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "@/context/CartProvider";
import { WishlistProvider } from "@/context/WishlistProvider";
import { AuthProvider } from "@/context/AuthProvider";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { RequireAdmin } from "@/components/auth/RequireAdmin";
import { Layout } from "@/components/layout/Layout";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Home } from "@/pages/Home";
import { Shop } from "@/pages/Shop";
import { ProductDetail } from "@/pages/ProductDetail";
import { Cart } from "@/pages/Cart";
import { Checkout } from "@/pages/Checkout";
import { OrderConfirmation } from "@/pages/OrderConfirmation";
import { Wishlist } from "@/pages/Wishlist";
import { Login } from "@/pages/Login";
import { Account } from "@/pages/Account";
import { About } from "@/pages/About";
import { Contact } from "@/pages/Contact";
import { Policy } from "@/pages/Policy";
import { DynamicPage } from "@/pages/DynamicPage";
import { AdminDashboard } from "@/pages/admin/AdminDashboard";
import { StoreSettings } from "@/pages/admin/StoreSettings";
import { ThemeEditor } from "@/pages/admin/ThemeEditor";
import { HomepageEditor } from "@/pages/admin/HomepageEditor";
import { ProductManager } from "@/pages/admin/ProductManager";
import { CategoryManager } from "@/pages/admin/CategoryManager";
import { NavigationEditor } from "@/pages/admin/NavigationEditor";
import { FooterEditor } from "@/pages/admin/FooterEditor";
import { PolicyEditor } from "@/pages/admin/PolicyEditor";
import { MediaManager } from "@/pages/admin/MediaManager";
import { Customers } from "@/pages/admin/Customers";
import { CustomerDetail } from "@/pages/admin/CustomerDetail";
import { NotFound } from "@/pages/NotFound";

/**
 * Route table. Every storefront page hangs off the shared <Layout /> (navbar
 * + footer + offline banner). About and Contact now ship real content
 * (Phase 6) - every nav destination in NAV_LINKS is now a real page, no
 * more PagePlaceholder stubs anywhere in the route table.
 *
 * CartProvider, WishlistProvider, and AuthProvider all wrap the router
 * (not just Layout) since they're plain React context with no dependency
 * on routing - keeping them outside the router means they'd survive a
 * future top-level router swap unaffected. Nesting order between the
 * three doesn't matter (none of them read from each other).
 *
 * /account is wrapped in RequireAuth, which redirects to /login (and back
 * again after a successful login/signup) if nobody's signed in.
 *
 * /admin (Phase 15) is a separate top-level route tree, not nested under
 * <Layout /> - the admin area has no use for the storefront navbar/footer
 * and gets its own sidebar shell (AdminLayout). It's wrapped in
 * RequireAdmin, which redirects signed-out visitors to /login and shows an
 * access-denied panel for signed-in non-admin accounts.
 */
function App() {
  return (
    <CartProvider>
      <WishlistProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route element={<Layout />}>
                <Route index element={<Home />} />
                <Route path="shop" element={<Shop />} />
                <Route path="shop/:id" element={<ProductDetail />} />
                <Route path="cart" element={<Cart />} />
                <Route path="checkout" element={<Checkout />} />
                <Route path="order-confirmation" element={<OrderConfirmation />} />
                <Route path="wishlist" element={<Wishlist />} />
                <Route path="login" element={<Login />} />
                <Route
                  path="account"
                  element={
                    <RequireAuth>
                      <Account />
                    </RequireAuth>
                  }
                />
                <Route path="about" element={<About />} />
                <Route path="contact" element={<Contact />} />
                <Route path="policies/:slug" element={<Policy />} />
                <Route path="faq" element={<DynamicPage slug="faq" />} />
                <Route path="*" element={<NotFound />} />
              </Route>
              <Route
                path="admin"
                element={
                  <RequireAdmin>
                    <AdminLayout />
                  </RequireAdmin>
                }
              >
                <Route index element={<AdminDashboard />} />
                <Route path="store-settings" element={<StoreSettings />} />
                <Route path="theme" element={<ThemeEditor />} />
                <Route path="homepage" element={<HomepageEditor />} />
                <Route path="products" element={<ProductManager />} />
                <Route path="categories" element={<CategoryManager />} />
                <Route path="navigation" element={<NavigationEditor />} />
                <Route path="footer" element={<FooterEditor />} />
                <Route path="policies" element={<PolicyEditor />} />
                <Route path="media" element={<MediaManager />} />
                <Route path="customers" element={<Customers />} />
                <Route path="customers/:email" element={<CustomerDetail />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </WishlistProvider>
    </CartProvider>
  );
}

export default App;
