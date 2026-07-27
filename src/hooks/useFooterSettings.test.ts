import { beforeEach, describe, expect, it } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { FOOTER_LINK_GROUPS } from "@/config/navigation";
import { branding } from "@/config/branding";
import { useFooterSettings } from "@/hooks/useFooterSettings";

describe("useFooterSettings", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("starts resolved to the static defaults with isOverridden false", () => {
    const { result } = renderHook(() => useFooterSettings());
    expect(result.current.linkGroups).toEqual(FOOTER_LINK_GROUPS);
    expect(result.current.copyrightHolder).toEqual(branding.copyrightHolder);
    expect(result.current.isOverridden).toBe(false);
  });

  it("re-renders with the new values immediately after save(), in the same tab", () => {
    const { result } = renderHook(() => useFooterSettings());
    const custom = [{ title: "Shop", links: [{ label: "All", to: "/shop" }] }];

    act(() => {
      result.current.save({ groups: custom, copyrightHolder: "Acme Co" });
    });

    expect(result.current.linkGroups).toEqual(custom);
    expect(result.current.copyrightHolder).toBe("Acme Co");
    expect(result.current.isOverridden).toBe(true);
  });

  it("re-renders back to the defaults immediately after reset()", () => {
    const { result } = renderHook(() => useFooterSettings());

    act(() => {
      result.current.save({ copyrightHolder: "Acme Co" });
    });
    act(() => {
      result.current.reset();
    });

    expect(result.current.linkGroups).toEqual(FOOTER_LINK_GROUPS);
    expect(result.current.copyrightHolder).toEqual(branding.copyrightHolder);
    expect(result.current.isOverridden).toBe(false);
  });
});
