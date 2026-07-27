import { describe, expect, it } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { CartProvider } from "@/context/CartProvider";
import { useCart } from "@/context/CartContext";
import { ALL_PRODUCTS } from "@/data/products";

const [PRODUCT_A, PRODUCT_B] = ALL_PRODUCTS;

function setup() {
  return renderHook(() => useCart(), { wrapper: CartProvider });
}

describe("CartProvider", () => {
  it("starts empty", () => {
    const { result } = setup();
    expect(result.current.items).toEqual([]);
    expect(result.current.totalCount).toBe(0);
    expect(result.current.subtotal).toBe(0);
  });

  it("adds a new item at quantity 1 by default", () => {
    const { result } = setup();
    act(() => result.current.addItem(PRODUCT_A.id));
    expect(result.current.items).toEqual([{ productId: PRODUCT_A.id, quantity: 1 }]);
    expect(result.current.totalCount).toBe(1);
  });

  it("increments quantity when adding an item already in the cart", () => {
    const { result } = setup();
    act(() => result.current.addItem(PRODUCT_A.id, 2));
    act(() => result.current.addItem(PRODUCT_A.id, 3));
    expect(result.current.items).toEqual([{ productId: PRODUCT_A.id, quantity: 5 }]);
  });

  it("caps quantity at MAX_QTY (10) both when adding and updating", () => {
    const { result } = setup();
    act(() => result.current.addItem(PRODUCT_A.id, 8));
    act(() => result.current.addItem(PRODUCT_A.id, 8));
    expect(result.current.items[0].quantity).toBe(10);

    act(() => result.current.updateQuantity(PRODUCT_A.id, 999));
    expect(result.current.items[0].quantity).toBe(10);
  });

  it("removes an item", () => {
    const { result } = setup();
    act(() => result.current.addItem(PRODUCT_A.id));
    act(() => result.current.removeItem(PRODUCT_A.id));
    expect(result.current.items).toEqual([]);
  });

  it("updateQuantity to 0 or below removes the item", () => {
    const { result } = setup();
    act(() => result.current.addItem(PRODUCT_A.id, 3));
    act(() => result.current.updateQuantity(PRODUCT_A.id, 0));
    expect(result.current.items).toEqual([]);
  });

  it("clearCart empties every item", () => {
    const { result } = setup();
    act(() => result.current.addItem(PRODUCT_A.id));
    act(() => result.current.addItem(PRODUCT_B.id));
    act(() => result.current.clearCart());
    expect(result.current.items).toEqual([]);
  });

  it("joins items with product data via `lines`, and computes subtotal from price * quantity", () => {
    const { result } = setup();
    act(() => result.current.addItem(PRODUCT_A.id, 2));
    expect(result.current.lines).toEqual([
      { productId: PRODUCT_A.id, quantity: 2, product: PRODUCT_A },
    ]);
    expect(result.current.subtotal).toBe(PRODUCT_A.price * 2);
  });

  it("totalCount sums quantities across multiple distinct items", () => {
    const { result } = setup();
    act(() => result.current.addItem(PRODUCT_A.id, 2));
    act(() => result.current.addItem(PRODUCT_B.id, 3));
    expect(result.current.totalCount).toBe(5);
  });

  it("persists to localStorage and restores on next mount", () => {
    const first = setup();
    act(() => first.result.current.addItem(PRODUCT_A.id, 4));

    const second = setup();
    expect(second.result.current.items).toEqual([{ productId: PRODUCT_A.id, quantity: 4 }]);
  });

  it("drops stored items whose product id no longer exists in the catalog", () => {
    window.localStorage.setItem(
      "store-cart",
      JSON.stringify([{ productId: "does-not-exist", quantity: 1 }]),
    );
    const { result } = setup();
    expect(result.current.items).toEqual([]);
  });

  it("useCart throws when used outside a CartProvider", () => {
    const { result } = renderHook(() => {
      try {
        return useCart();
      } catch (err) {
        return err as Error;
      }
    });
    expect(result.current).toBeInstanceOf(Error);
  });
});
