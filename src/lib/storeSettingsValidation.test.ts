import { describe, expect, it } from "vitest";
import { validateStoreSettings } from "@/lib/storeSettingsValidation";

describe("validateStoreSettings", () => {
  it("passes with a business name and a valid email", () => {
    expect(validateStoreSettings({ businessName: "Willow & Vine", email: "hello@willowvine.example" })).toEqual({});
  });

  it("passes with a business name and an empty email (contact email is optional)", () => {
    expect(validateStoreSettings({ businessName: "Willow & Vine", email: "" })).toEqual({});
  });

  it("requires a non-blank business name", () => {
    expect(validateStoreSettings({ businessName: "  ", email: "" }).businessName).toBe(
      "Business name is required.",
    );
  });

  it("rejects a malformed email", () => {
    expect(validateStoreSettings({ businessName: "Willow & Vine", email: "not-an-email" }).email).toBe(
      "Please enter a valid email address.",
    );
  });
});
