import { describe, expect, it } from "vitest";
import { RADIUS_SCALE_OPTIONS, matchRadiusScaleId } from "@/config/radiusScales";
import { PRESETS } from "@/config/presets";

describe("matchRadiusScaleId", () => {
  it("matches a curated scale's own radius object back to its id", () => {
    for (const option of RADIUS_SCALE_OPTIONS) {
      expect(matchRadiusScaleId(option.radius)).toBe(option.id);
    }
  });

  it("returns null for a preset radius that isn't one of the curated scales", () => {
    // minimal's radius (0.25/0.375/0.5/0.75) doesn't exactly match any curated scale.
    expect(matchRadiusScaleId(PRESETS.minimal.theme.radius)).toBeNull();
  });

  it("matches classic's radius to the 'standard' scale (they're defined identically)", () => {
    expect(matchRadiusScaleId(PRESETS.classic.theme.radius)).toBe("standard");
  });
});
