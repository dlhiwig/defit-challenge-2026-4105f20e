import { describe, expect, it } from "vitest";
import { averageThreeReadings } from "@/components/whtr/ThreeReadingCalculator";

describe("three-reading waist averaging", () => {
  it("rounds each reading down before averaging", () => {
    expect(averageThreeReadings([35.9, 36.4, 36.9], false)).toBe(36);
  });
  it("uses equivalent half-inch steps for metric inputs", () => {
    expect(averageThreeReadings([35.5, 36, 36.5].map(v => v * 2.54), true)).toBe(36);
  });
  it("requires exactly three positive finite readings", () => {
    expect(averageThreeReadings([36, 36], false)).toBeNull();
    expect(averageThreeReadings([36, 0, 36], false)).toBeNull();
    expect(averageThreeReadings([36, NaN, 36], false)).toBeNull();
  });
});
