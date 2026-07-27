import { describe, expect, it } from "vitest";
import { formatPHP } from "@/lib/currency";

describe("formatPHP", () => {
  it("formats a whole peso amount with the currency symbol", () => {
    expect(formatPHP(500)).toBe("₱500");
  });

  it("rounds to zero decimal places", () => {
    expect(formatPHP(199.5)).toBe("₱200");
  });

  it("formats zero", () => {
    expect(formatPHP(0)).toBe("₱0");
  });

  it("adds thousands separators for large amounts", () => {
    expect(formatPHP(12500)).toBe("₱12,500");
  });
});
