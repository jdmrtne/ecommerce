import { useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Menu, X, Search, Heart, ShoppingBag, Moon, Sun, User, LogOut } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/hooks/useTheme";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { useAuth } from "@/context/AuthContext";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { NotificationBell } from "@/components/layout/NotificationBell";
import { cn } from "@/lib/cn";
import { useStoreSettings } from "@/hooks/useStoreSettings";
import { useThemeSettings } from "@/hooks/useThemeSettings";
import { useNavigation } from "@/hooks/useNavigation";

/**
 * Sticky top navigation. Cart is wired to real state (Phase 4) - the badge
 * reflects CartContext and the icon opens CartDrawer. Wishlist is wired to
 * real state too (Phase 5) - the badge reflects WishlistContext and the
 * icon navigates to the dedicated /wishlist page (a page, not a drawer,
 * since wishlists tend to be browsed rather than glanced at). Account
 * (Phase 6) follows the same pattern as wishlist - a single icon that
 * routes to /login when signed out or /account when signed in, rather
 * than a dropdown, to stay consistent with how the other icons work.
 * Nav links (Phase 8) come from `config/navigation.ts` - MAIN_NAV. Phase 21
 * switched both the desktop and mobile/minimal link lists from the static
 * MAIN_NAV import to `useNavigation()`'s resolved list, so a Navigation
 * Editor save is reflected immediately across all three navStyle variants
 * below, no reload.
 *
 * Phase 12: the header's structural layout switches on the active
 * preset's `navStyle` (`config/presets/`) - `standard` (logo left, links
 * center, full icon cluster right - the original Phase 1-11 layout),
 * `centered` (logo on its own row, links + icons below), or `minimal`
 * (compact single row, links and secondary icons tucked behind the menu
 * toggle at every breakpoint, not just mobile). All three variants share
 * the same state, search panel, mobile-style menu panel, and CartDrawer -
 * only the always-visible header markup branches, so nothing is
 * duplicated per style.
 */
export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const { theme, toggleTheme } = useTheme();
  const { totalCount } = useCart();
  const { count: wishlistCount } = useWishlist();
  const { isAuthenticated, logout } = useAuth();
  const { branding } = useStoreSettings();
  const { activePreset } = useThemeSettings();
  const { mainNav } = useNavigation();
  const navigate = useNavigate();

  const navStyle = activePreset.navStyle;
  const isMinimal = navStyle === "minimal";
  const isCentered = navStyle === "centered";

  function handleSearchSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = searchValue.trim();
    navigate(trimmed ? `/shop?q=${encodeURIComponent(trimmed)}` : "/shop");
    setIsSearchOpen(false);
  }

  const logoLink = (
    <Link to="/" className="flex items-center gap-2" aria-label={`${branding.businessName} home`}>
      <img src={branding.logo} alt={branding.logoAlt} className="h-14 w-auto" />
    </Link>
  );

  const desktopLinks = (
    <nav className="hidden items-center gap-8 md:flex" aria-label="Main navigation">
      {mainNav.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          className={({ isActive }) =>
            cn(
              "text-sm font-semibold tracking-wide transition-colors hover:text-denim",
              isActive ? "text-denim" : "text-ink",
            )
          }
        >
          {link.label}
        </NavLink>
      ))}
    </nav>
  );

  const menuToggle = (
    <button
      className={cn(
        "rounded-full p-2 text-ink transition-colors hover:bg-beige",
        isMinimal ? "" : "ml-1 md:hidden",
      )}
      aria-label="Toggle menu"
      aria-expanded={isMenuOpen}
      onClick={() => setIsMenuOpen((v) => !v)}
    >
      {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
    </button>
  );

  const fullIconCluster = (
    <div className={cn("flex items-center gap-1 sm:gap-2", isCentered && "ml-auto")}>
      <IconButton
        label={isSearchOpen ? "Close search" : "Search"}
        onClick={() => setIsSearchOpen((v) => !v)}
      >
        {isSearchOpen ? <X size={20} /> : <Search size={20} />}
      </IconButton>
      <IconButton
        label={isAuthenticated ? "Account" : "Log in"}
        onClick={() => navigate(isAuthenticated ? "/account" : "/login")}
      >
        <User size={20} />
      </IconButton>
      <NotificationBell />
      <IconButton label="Wishlist" onClick={() => navigate("/wishlist")} badge={wishlistCount}>
        <Heart size={20} />
      </IconButton>
      <IconButton label="Cart" onClick={() => setIsCartOpen(true)} badge={totalCount}>
        <ShoppingBag size={20} />
      </IconButton>
      <IconButton
        label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
        onClick={toggleTheme}
      >
        {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
      </IconButton>
      {menuToggle}
    </div>
  );

  const minimalIconCluster = (
    <div className="flex items-center gap-1 sm:gap-2">
      <IconButton
        label={isSearchOpen ? "Close search" : "Search"}
        onClick={() => setIsSearchOpen((v) => !v)}
      >
        {isSearchOpen ? <X size={20} /> : <Search size={20} />}
      </IconButton>
      <IconButton label="Cart" onClick={() => setIsCartOpen(true)} badge={totalCount}>
        <ShoppingBag size={20} />
      </IconButton>
      <NotificationBell />
      {menuToggle}
    </div>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-beige bg-cream/90 backdrop-blur-md">
      {isCentered ? (
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-center border-b border-beige/70">
            {logoLink}
          </div>
          <div className="flex h-16 items-center">
            {desktopLinks}
            {fullIconCluster}
          </div>
        </div>
      ) : (
        <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-4 py-2 sm:px-6 lg:px-8">
          {logoLink}
          {!isMinimal && desktopLinks}
          {isMinimal ? minimalIconCluster : fullIconCluster}
        </div>
      )}

      <AnimatePresence>
        {isSearchOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden border-t border-beige bg-cream"
          >
            <form onSubmit={handleSearchSubmit} className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
              <div className="relative">
                <Search
                  size={18}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-soft"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  autoFocus
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  placeholder="Search products..."
                  aria-label="Search products"
                  className="w-full rounded-md border-2 border-beige bg-surface py-2.5 pl-10 pr-4 text-ink placeholder:text-ink-soft/60 transition-colors duration-200 focus:border-denim focus:outline-none"
                />
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isMenuOpen && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className={cn("overflow-hidden border-t border-beige bg-cream", isMinimal ? "" : "md:hidden")}
            aria-label={isMinimal ? "Navigation menu" : "Mobile navigation"}
          >
            <div className="flex flex-col gap-1 px-4 py-3">
              {mainNav.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={() => setIsMenuOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      "rounded-md px-3 py-2.5 text-base font-semibold",
                      isActive ? "bg-bloom-tint text-bloom-deep" : "text-ink hover:bg-beige",
                    )
                  }
                >
                  {link.label}
                </NavLink>
              ))}

              {isMinimal && (
                <>
                  <NavLink
                    to="/wishlist"
                    onClick={() => setIsMenuOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-2 rounded-md px-3 py-2.5 text-base font-semibold",
                        isActive ? "bg-bloom-tint text-bloom-deep" : "text-ink hover:bg-beige",
                      )
                    }
                  >
                    <Heart size={18} />
                    Wishlist{wishlistCount > 0 ? ` (${wishlistCount})` : ""}
                  </NavLink>
                  <button
                    type="button"
                    onClick={() => {
                      toggleTheme();
                      setIsMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-left text-base font-semibold text-ink hover:bg-beige"
                  >
                    {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
                    {theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
                  </button>
                </>
              )}

              <div className="mt-1 border-t border-beige pt-1">
                {isAuthenticated ? (
                  <>
                    <NavLink
                      to="/account"
                      onClick={() => setIsMenuOpen(false)}
                      className={({ isActive }) =>
                        cn(
                          "flex items-center gap-2 rounded-md px-3 py-2.5 text-base font-semibold",
                          isActive ? "bg-bloom-tint text-bloom-deep" : "text-ink hover:bg-beige",
                        )
                      }
                    >
                      <User size={18} />
                      My Account
                    </NavLink>
                    <button
                      type="button"
                      onClick={() => {
                        // Real page navigation, not react-router's
                        // navigate() - see Account.tsx's logout button for
                        // the full explanation of why the SPA navigate
                        // can't reliably win the race against RequireAuth's
                        // own redirect when logging out from /account.
                        // Phase 26: logout() is now async (a real Supabase
                        // signOut call) - awaited before the hard
                        // navigation so it isn't aborted by page unload.
                        setIsMenuOpen(false);
                        void logout().then(() => {
                          window.location.href = "/";
                        });
                      }}
                      className="flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-left text-base font-semibold text-ink hover:bg-beige"
                    >
                      <LogOut size={18} />
                      Log out
                    </button>
                  </>
                ) : (
                  <NavLink
                    to="/login"
                    onClick={() => setIsMenuOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-2 rounded-md px-3 py-2.5 text-base font-semibold",
                        isActive ? "bg-bloom-tint text-bloom-deep" : "text-ink hover:bg-beige",
                      )
                    }
                  >
                    <User size={18} />
                    Log in / Sign up
                  </NavLink>
                )}
              </div>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>

      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </header>
  );
}

function IconButton({
  children,
  label,
  onClick,
  badge,
}: {
  children: ReactNode;
  label: string;
  onClick: () => void;
  badge?: number;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="relative rounded-full p-2 text-ink transition-colors hover:bg-beige hover:text-denim"
    >
      {children}
      {typeof badge === "number" && badge > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-bloom text-[10px] font-bold text-surface">
          {badge}
        </span>
      )}
    </button>
  );
}
