import { beforeEach, describe, expect, it } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { MAIN_NAV } from "@/config/navigation";
import { useNavigation } from "@/hooks/useNavigation";

describe("useNavigation", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("starts resolved to MAIN_NAV with isOverridden false", () => {
    const { result } = renderHook(() => useNavigation());
    expect(result.current.mainNav).toEqual(MAIN_NAV);
    expect(result.current.isOverridden).toBe(false);
  });

  it("re-renders with the new link list immediately after save(), in the same tab", () => {
    const { result } = renderHook(() => useNavigation());
    const custom = [{ label: "Shop", to: "/shop" }];

    act(() => {
      result.current.save(custom);
    });

    expect(result.current.mainNav).toEqual(custom);
    expect(result.current.isOverridden).toBe(true);
  });

  it("re-renders back to the default immediately after reset()", () => {
    const { result } = renderHook(() => useNavigation());

    act(() => {
      result.current.save([{ label: "Shop", to: "/shop" }]);
    });
    act(() => {
      result.current.reset();
    });

    expect(result.current.mainNav).toEqual(MAIN_NAV);
    expect(result.current.isOverridden).toBe(false);
  });
});
