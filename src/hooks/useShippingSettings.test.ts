import { beforeEach, describe, expect, it } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { DEFAULT_SHIPPING_METHODS } from "@/config/shipping";
import type { ShippingMethod } from "@/types/shipping";
import { useShippingSettings } from "@/hooks/useShippingSettings";

const CUSTOM_METHODS: ShippingMethod[] = [{ id: "flat", name: "Flat Rate", rate: 100 }];

describe("useShippingSettings", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("starts resolved to the static defaults with isOverridden false", () => {
    const { result } = renderHook(() => useShippingSettings());
    expect(result.current.methods).toEqual(DEFAULT_SHIPPING_METHODS);
    expect(result.current.isOverridden).toBe(false);
  });

  it("re-renders with the new method list immediately after save(), in the same tab", () => {
    const { result } = renderHook(() => useShippingSettings());

    act(() => {
      result.current.save(CUSTOM_METHODS);
    });

    expect(result.current.methods).toEqual(CUSTOM_METHODS);
    expect(result.current.isOverridden).toBe(true);
  });

  it("re-renders back to the default immediately after reset()", () => {
    const { result } = renderHook(() => useShippingSettings());

    act(() => {
      result.current.save(CUSTOM_METHODS);
    });
    act(() => {
      result.current.reset();
    });

    expect(result.current.methods).toEqual(DEFAULT_SHIPPING_METHODS);
    expect(result.current.isOverridden).toBe(false);
  });
});
