import { describe, expect, it } from "vitest";
import { validateCategory } from "@/lib/categoryValidation";

const ICON_NAMES = ["Gem", "Heart", "Package"];

describe("validateCategory", () => {
  it("passes for fully valid values", () => {
    expect(
      validateCategory({ label: "Home Decor", description: "Cozy things.", icon: "Gem" }, ICON_NAMES),
    ).toEqual({});
  });

  it("requires a label", () => {
    const errors = validateCategory({ label: "  ", description: "d", icon: "Gem" }, ICON_NAMES);
    expect(errors.label).toBeTruthy();
  });

  it("requires a description", () => {
    const errors = validateCategory({ label: "Home Decor", description: "  ", icon: "Gem" }, ICON_NAMES);
    expect(errors.description).toBeTruthy();
  });

  it("requires an icon", () => {
    const errors = validateCategory({ label: "Home Decor", description: "d", icon: "" }, ICON_NAMES);
    expect(errors.icon).toBeTruthy();
  });

  it("rejects an icon name not in the registry", () => {
    const errors = validateCategory({ label: "Home Decor", description: "d", icon: "NotARealIcon" }, ICON_NAMES);
    expect(errors.icon).toBeTruthy();
  });
});
