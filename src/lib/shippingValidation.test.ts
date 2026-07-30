import { describe, expect, it } from "vitest";
import { validateShippingMethod, validateShippingMethods } from "@/lib/shippingValidation";

describe("validateShippingMethod", () => {
  it("requires a name", () => {
    const errors = validateShippingMethod({ name: "  ", rate: "80", freeThreshold: "" });
    expect(errors.name).toBe("Name is required.");
  });

  it("requires a non-negative numeric rate", () => {
    expect(validateShippingMethod({ name: "Standard", rate: "", freeThreshold: "" }).rate).toBeDefined();
    expect(validateShippingMethod({ name: "Standard", rate: "abc", freeThreshold: "" }).rate).toBeDefined();
    expect(validateShippingMethod({ name: "Standard", rate: "-1", freeThreshold: "" }).rate).toBeDefined();
  });

  it("accepts a zero rate (free shipping method)", () => {
    expect(validateShippingMethod({ name: "Standard", rate: "0", freeThreshold: "" }).rate).toBeUndefined();
  });

  it("leaves freeThreshold optional - blank is valid", () => {
    expect(
      validateShippingMethod({ name: "Standard", rate: "80", freeThreshold: "" }).freeThreshold,
    ).toBeUndefined();
  });

  it("rejects a negative or non-numeric freeThreshold", () => {
    expect(
      validateShippingMethod({ name: "Standard", rate: "80", freeThreshold: "-5" }).freeThreshold,
    ).toBeDefined();
    expect(
      validateShippingMethod({ name: "Standard", rate: "80", freeThreshold: "abc" }).freeThreshold,
    ).toBeDefined();
  });

  it("accepts a valid, fully-filled-in row with no errors", () => {
    expect(validateShippingMethod({ name: "Standard", rate: "80", freeThreshold: "1500" })).toEqual({});
  });
});

describe("validateShippingMethods", () => {
  it("requires at least one method", () => {
    const { listError } = validateShippingMethods([]);
    expect(listError).toBe("Add at least one shipping method.");
  });

  it("returns no listError once at least one method is present", () => {
    const { listError } = validateShippingMethods([{ name: "Standard", rate: "80", freeThreshold: "" }]);
    expect(listError).toBeUndefined();
  });

  it("validates every row independently", () => {
    const { rowErrors } = validateShippingMethods([
      { name: "Standard", rate: "80", freeThreshold: "" },
      { name: "", rate: "-1", freeThreshold: "" },
    ]);
    expect(rowErrors[0]).toEqual({});
    expect(rowErrors[1].name).toBeDefined();
    expect(rowErrors[1].rate).toBeDefined();
  });
});
