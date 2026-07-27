import { describe, expect, it } from "vitest";
import { buildTitle } from "@/config/titleTemplate";

describe("buildTitle", () => {
  it("uses '<business> | <tagline>' when no page title is given (homepage)", () => {
    expect(buildTitle("My Business", "Your tagline", "")).toBe("My Business | Your tagline");
  });

  it("uses '<page> | <business>' when a page title is given", () => {
    expect(buildTitle("My Business", "Your tagline", "Shop")).toBe("Shop | My Business");
  });
});
