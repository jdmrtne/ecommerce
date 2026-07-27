import { describe, expect, it } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { WishlistProvider } from "@/context/WishlistProvider";
import { useWishlist } from "@/context/WishlistContext";
import { ALL_PRODUCTS } from "@/data/products";

const [PRODUCT_A, PRODUCT_B] = ALL_PRODUCTS;

function setup() {
  return renderHook(() => useWishlist(), { wrapper: WishlistProvider });
}

describe("WishlistProvider", () => {
  it("starts empty", () => {
    const { result } = setup();
    expect(result.current.items).toEqual([]);
    expect(result.current.count).toBe(0);
  });

  it("toggleWishlist adds an id, then removes it on a second call", () => {
    const { result } = setup();
    act(() => result.current.toggleWishlist(PRODUCT_A.id));
    expect(result.current.isWishlisted(PRODUCT_A.id)).toBe(true);
    expect(result.current.count).toBe(1);

    act(() => result.current.toggleWishlist(PRODUCT_A.id));
    expect(result.current.isWishlisted(PRODUCT_A.id)).toBe(false);
    expect(result.current.count).toBe(0);
  });

  it("removeItem removes a specific id", () => {
    const { result } = setup();
    act(() => result.current.toggleWishlist(PRODUCT_A.id));
    act(() => result.current.toggleWishlist(PRODUCT_B.id));
    act(() => result.current.removeItem(PRODUCT_A.id));
    expect(result.current.productIds).toEqual([PRODUCT_B.id]);
  });

  it("clearWishlist empties every id", () => {
    const { result } = setup();
    act(() => result.current.toggleWishlist(PRODUCT_A.id));
    act(() => result.current.toggleWishlist(PRODUCT_B.id));
    act(() => result.current.clearWishlist());
    expect(result.current.items).toEqual([]);
  });

  it("joins ids with product data via `items`", () => {
    const { result } = setup();
    act(() => result.current.toggleWishlist(PRODUCT_A.id));
    expect(result.current.items).toEqual([PRODUCT_A]);
  });

  it("persists to localStorage and restores on next mount", () => {
    const first = setup();
    act(() => first.result.current.toggleWishlist(PRODUCT_B.id));

    const second = setup();
    expect(second.result.current.productIds).toEqual([PRODUCT_B.id]);
  });

  it("drops stored ids whose product no longer exists in the catalog", () => {
    window.localStorage.setItem("store-wishlist", JSON.stringify(["does-not-exist"]));
    const { result } = setup();
    expect(result.current.productIds).toEqual([]);
  });

  it("useWishlist throws when used outside a WishlistProvider", () => {
    const { result } = renderHook(() => {
      try {
        return useWishlist();
      } catch (err) {
        return err as Error;
      }
    });
    expect(result.current).toBeInstanceOf(Error);
  });
});
