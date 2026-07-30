import { beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_SHIPPING_METHODS } from "@/config/shipping";
import type { ShippingMethod } from "@/types/shipping";
import {
  SHIPPING_SETTINGS_CHANGE_EVENT,
  computeShippingFee,
  filterMethodsForProvince,
  generateShippingMethodId,
  getShippingSettingsOverride,
  resetShippingSettingsOverride,
  resolveShippingMethods,
  resolveShippingMethodsForProvince,
  saveShippingSettingsOverride,
} from "@/lib/shippingSettingsStore";

const CUSTOM_METHODS: ShippingMethod[] = [
  { id: "flat", name: "Flat Rate", description: "Nationwide flat rate.", rate: 100 },
  {
    id: "mm-express",
    name: "Metro Manila Express",
    description: "Next-day delivery.",
    rate: 150,
    freeThreshold: 3000,
    provinces: ["Metro Manila"],
  },
];

describe("shippingSettingsStore", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("resolves to the static defaults when nothing has been saved", () => {
    expect(getShippingSettingsOverride()).toEqual({});
    expect(resolveShippingMethods()).toEqual(DEFAULT_SHIPPING_METHODS);
  });

  it("saves a full replacement method list and resolves it instead of the default", () => {
    saveShippingSettingsOverride(CUSTOM_METHODS);
    expect(resolveShippingMethods()).toEqual(CUSTOM_METHODS);
  });

  it("persists across a fresh read (survives a refresh)", () => {
    saveShippingSettingsOverride(CUSTOM_METHODS);
    expect(getShippingSettingsOverride()).toEqual({ methods: CUSTOM_METHODS });
  });

  it("reset clears the override and restores the static defaults", () => {
    saveShippingSettingsOverride(CUSTOM_METHODS);
    expect(resolveShippingMethods()).not.toEqual(DEFAULT_SHIPPING_METHODS);

    resetShippingSettingsOverride();
    expect(getShippingSettingsOverride()).toEqual({});
    expect(resolveShippingMethods()).toEqual(DEFAULT_SHIPPING_METHODS);
  });

  it("dispatches the change event on save and reset", () => {
    const handler = vi.fn();
    window.addEventListener(SHIPPING_SETTINGS_CHANGE_EVENT, handler);

    saveShippingSettingsOverride(CUSTOM_METHODS);
    expect(handler).toHaveBeenCalledTimes(1);

    resetShippingSettingsOverride();
    expect(handler).toHaveBeenCalledTimes(2);

    window.removeEventListener(SHIPPING_SETTINGS_CHANGE_EVENT, handler);
  });

  it("falls back to the default when localStorage contains corrupted JSON", () => {
    window.localStorage.setItem("store-shipping-settings", "{not valid json");
    expect(getShippingSettingsOverride()).toEqual({});
    expect(resolveShippingMethods()).toEqual(DEFAULT_SHIPPING_METHODS);
  });

  it("falls back to the default when a saved method is missing required fields", () => {
    window.localStorage.setItem(
      "store-shipping-settings",
      JSON.stringify({ methods: [{ id: "bad", name: "Bad" }] }),
    );
    expect(getShippingSettingsOverride()).toEqual({});
  });

  describe("filterMethodsForProvince / resolveShippingMethodsForProvince", () => {
    it("includes every nationwide method regardless of province", () => {
      const filtered = filterMethodsForProvince(CUSTOM_METHODS, "Cebu");
      expect(filtered).toEqual([CUSTOM_METHODS[0]]);
    });

    it("includes a zone-restricted method only for a matching province", () => {
      const filtered = filterMethodsForProvince(CUSTOM_METHODS, "Metro Manila");
      expect(filtered).toEqual(CUSTOM_METHODS);
    });

    it("matches province case-insensitively and ignores surrounding whitespace", () => {
      const filtered = filterMethodsForProvince(CUSTOM_METHODS, "  metro manila  ");
      expect(filtered).toEqual(CUSTOM_METHODS);
    });

    it("resolves the live saved methods filtered for a province in one call", () => {
      saveShippingSettingsOverride(CUSTOM_METHODS);
      expect(resolveShippingMethodsForProvince("Metro Manila")).toEqual(CUSTOM_METHODS);
      expect(resolveShippingMethodsForProvince("Cebu")).toEqual([CUSTOM_METHODS[0]]);
    });

    it("never excludes every method as long as one nationwide method exists, even for a blank province", () => {
      expect(filterMethodsForProvince(CUSTOM_METHODS, "")).toEqual([CUSTOM_METHODS[0]]);
    });
  });

  describe("computeShippingFee", () => {
    it("charges the flat rate below the free-shipping threshold", () => {
      expect(computeShippingFee(CUSTOM_METHODS[1], 1000)).toBe(150);
    });

    it("waives the fee at or above the free-shipping threshold", () => {
      expect(computeShippingFee(CUSTOM_METHODS[1], 3000)).toBe(0);
      expect(computeShippingFee(CUSTOM_METHODS[1], 5000)).toBe(0);
    });

    it("always charges the flat rate when no free-shipping threshold is configured", () => {
      expect(computeShippingFee(CUSTOM_METHODS[0], 1_000_000)).toBe(100);
    });
  });

  describe("generateShippingMethodId", () => {
    it("slugifies the name", () => {
      expect(generateShippingMethodId("Metro Manila Express", [])).toBe("metro-manila-express");
    });

    it("appends a numeric suffix on collision", () => {
      expect(generateShippingMethodId("Standard", ["standard"])).toBe("standard-2");
      expect(generateShippingMethodId("Standard", ["standard", "standard-2"])).toBe("standard-3");
    });
  });
});
