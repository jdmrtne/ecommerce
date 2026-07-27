import { beforeEach, describe, expect, it } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { branding as BRANDING_DEFAULTS } from "@/config/branding";
import { useStoreSettings } from "@/hooks/useStoreSettings";

describe("useStoreSettings", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("starts resolved to the static defaults with isOverridden false", () => {
    const { result } = renderHook(() => useStoreSettings());
    expect(result.current.branding.businessName).toBe(BRANDING_DEFAULTS.businessName);
    expect(result.current.isOverridden).toBe(false);
  });

  it("re-renders with the new resolved value immediately after save(), in the same tab", () => {
    const { result } = renderHook(() => useStoreSettings());

    act(() => {
      result.current.save({ businessName: "Willow & Vine" });
    });

    expect(result.current.branding.businessName).toBe("Willow & Vine");
    expect(result.current.isOverridden).toBe(true);
  });

  it("re-renders back to the default immediately after reset()", () => {
    const { result } = renderHook(() => useStoreSettings());

    act(() => {
      result.current.save({ businessName: "Willow & Vine" });
    });
    act(() => {
      result.current.reset();
    });

    expect(result.current.branding.businessName).toBe(BRANDING_DEFAULTS.businessName);
    expect(result.current.isOverridden).toBe(false);
  });
});
