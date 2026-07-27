import { beforeEach, describe, expect, it } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { POLICY_PAGES } from "@/content/policies";
import { usePolicySettings } from "@/hooks/usePolicySettings";

describe("usePolicySettings", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("starts resolved to the static defaults with every slug not overridden", () => {
    const { result } = renderHook(() => usePolicySettings());
    expect(result.current.pages).toEqual(POLICY_PAGES);
    expect(result.current.isOverridden("privacy")).toBe(false);
    expect(result.current.isOverridden("terms")).toBe(false);
  });

  it("re-renders with the new document immediately after save(), in the same tab", () => {
    const { result } = renderHook(() => usePolicySettings());
    const custom = { title: "Custom Privacy", lastUpdated: "2026-02-01", sections: [{ heading: "H", body: "B" }] };

    act(() => {
      result.current.save("privacy", custom);
    });

    expect(result.current.pages.privacy).toEqual(custom);
    expect(result.current.pages.terms).toEqual(POLICY_PAGES.terms);
    expect(result.current.isOverridden("privacy")).toBe(true);
    expect(result.current.isOverridden("terms")).toBe(false);
  });

  it("re-renders back to that slug's default immediately after reset(slug), leaving other slugs untouched", () => {
    const { result } = renderHook(() => usePolicySettings());

    act(() => {
      result.current.save("privacy", { title: "P", lastUpdated: "2026-01-02", sections: [] });
      result.current.save("terms", { title: "T", lastUpdated: "2026-01-03", sections: [] });
    });
    act(() => {
      result.current.reset("privacy");
    });

    expect(result.current.pages.privacy).toEqual(POLICY_PAGES.privacy);
    expect(result.current.isOverridden("privacy")).toBe(false);
    expect(result.current.pages.terms.title).toBe("T");
    expect(result.current.isOverridden("terms")).toBe(true);
  });

  it("re-renders every slug back to defaults immediately after resetAll()", () => {
    const { result } = renderHook(() => usePolicySettings());

    act(() => {
      result.current.save("privacy", { title: "P", lastUpdated: "2026-01-02", sections: [] });
      result.current.save("terms", { title: "T", lastUpdated: "2026-01-03", sections: [] });
    });
    act(() => {
      result.current.resetAll();
    });

    expect(result.current.pages).toEqual(POLICY_PAGES);
    expect(result.current.isOverridden("privacy")).toBe(false);
    expect(result.current.isOverridden("terms")).toBe(false);
  });
});
