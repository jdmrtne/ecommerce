/**
 * Default copy for every loading/empty/error/offline state in the app.
 * Components still accept `title`/`description`/`actionLabel` as props
 * (see `src/components/ui/StateMessage.tsx`), so a page can override a
 * specific case - but the copy customers actually see by default lives
 * here, not scattered across each page file.
 */

export const LOADING = {
  /** Default label under the spinner in `LoadingState` (route/section-level fetches). */
  defaultLabel: "Loading...",
};

interface StateCopy {
  title: string;
  description: string;
  actionLabel?: string;
}

export const EMPTY_STATES = {
  cart: {
    title: "Your cart is empty",
    description: "Add a few products to see them here.",
    actionLabel: "Browse the shop",
  } satisfies StateCopy,
  wishlist: {
    title: "Your wishlist is empty",
    description: "Tap the heart on any product to save it here.",
    actionLabel: "Browse the shop",
  } satisfies StateCopy,
  orders: {
    title: "No orders yet",
    description: "Your placed orders will show up here.",
    actionLabel: "Browse the shop",
  } satisfies StateCopy,
  productNotFound: {
    title: "Product not found",
    description: "This item may have sold out or the link may be off. Take a look at everything else in the shop.",
    actionLabel: "Back to shop",
  } satisfies StateCopy,
  shopNoResults: {
    title: "No products found",
    description: "No products match the selected filters.",
  } satisfies StateCopy,
  shopNoResultsQuery: (query: string) => ({
    title: "No products found",
    description: `Nothing matched "${query}". Try a different search or clear your filters.`,
    actionLabel: "Clear filters",
  }) satisfies StateCopy,
  adminCustomersNoResults: {
    title: "No customers found",
    description: "No registered customers match the selected filters.",
  } satisfies StateCopy,
  customerNotFound: {
    title: "Customer not found",
    description: "This account may no longer exist. Take a look at the full customer list instead.",
    actionLabel: "Back to customers",
  } satisfies StateCopy,
};

export const ERROR_STATES = {
  shop: {
    title: "Couldn't load products",
    description: "Something went wrong while loading the shop. Please try again.",
    actionLabel: "Retry",
  } satisfies StateCopy,
  product: {
    title: "Couldn't load this product",
    description: "Something went wrong while loading this page. Please try again.",
    actionLabel: "Retry",
  } satisfies StateCopy,
  adminProducts: {
    title: "Couldn't load the catalog",
    description: "Something went wrong while loading products. Please try again.",
    actionLabel: "Retry",
  } satisfies StateCopy,
  orders: {
    title: "Couldn't load your orders",
    description: "Something went wrong while loading your order history. Please try again.",
    actionLabel: "Retry",
  } satisfies StateCopy,
  media: {
    title: "Couldn't load your media library",
    description: "Something went wrong while loading your uploaded images. Please try again.",
    actionLabel: "Retry",
  } satisfies StateCopy,
  adminCustomers: {
    title: "Couldn't load customers",
    description: "Something went wrong while loading the customer list. Please try again.",
    actionLabel: "Retry",
  } satisfies StateCopy,
  boundary: {
    title: "Something went a little wobbly",
    description: "This part of the page hit a snag. Refreshing usually fixes it.",
    actionLabel: "Refresh page",
  } satisfies StateCopy,
};

export const OFFLINE = {
  message: "You're offline. Some features may not work until you're back online.",
};
