import { beforeEach, describe, expect, it } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { ACTIVE_HOME_LAYOUT, HOME_LAYOUTS } from "@/config/layouts/home";
import { useHomepageSettings } from "@/hooks/useHomepageSettings";

describe("useHomepageSettings", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("starts resolved to ACTIVE_HOME_LAYOUT with isOverridden false", () => {
    const { result } = renderHook(() => useHomepageSettings());
    expect(result.current.layout).toEqual(HOME_LAYOUTS[ACTIVE_HOME_LAYOUT]);
    expect(result.current.isOverridden).toBe(false);
  });

  it("re-renders with the new layout immediately after save(), in the same tab", () => {
    const { result } = renderHook(() => useHomepageSettings());

    act(() => {
      result.current.save({ activeLayoutId: "minimal" });
    });

    expect(result.current.layout.sections).toEqual(HOME_LAYOUTS.minimal.sections);
    expect(result.current.isOverridden).toBe(true);
  });

  it("re-renders back to the default immediately after reset()", () => {
    const { result } = renderHook(() => useHomepageSettings());

    act(() => {
      result.current.save({ activeLayoutId: "minimal" });
    });
    act(() => {
      result.current.reset();
    });

    expect(result.current.layout).toEqual(HOME_LAYOUTS[ACTIVE_HOME_LAYOUT]);
    expect(result.current.isOverridden).toBe(false);
  });
});
