import { describe, expect, it } from "vitest";
import {
  ARMY_WHTR_LIMIT,
  averageMeasurements,
  buildThresholdTable,
  calculateWhtr,
  cmToInches,
  feetInchesToInches,
  formatFeetInches,
  formatWhtr,
  highestHalfIncrementBelow,
  statusFromRatio,
  thresholdWaistForHeight,
  truncateToThreeDecimals,
  validateMeasurement,
} from "@/lib/whtr";

describe("Army WHtR truncation rule (AD 2026-13)", () => {
  it("truncates rather than rounds at the third decimal", () => {
    expect(truncateToThreeDecimals(0.549999)).toBe(0.549);
    expect(truncateToThreeDecimals(0.550001)).toBe(0.55);
    expect(truncateToThreeDecimals(0.548875)).toBe(0.548);
    expect(truncateToThreeDecimals(0.5489999999)).toBe(0.548);
  });

  it("formats to exactly three decimals", () => {
    expect(formatWhtr(0.55)).toBe("0.550");
    expect(formatWhtr(0.549999)).toBe("0.549");
  });

  it("treats 0.550 as failing and 0.549 as passing", () => {
    expect(statusFromRatio(0.549)).toBe("within");
    expect(statusFromRatio(0.55)).toBe("fails");
    expect(ARMY_WHTR_LIMIT).toBe(0.55);
  });
});

describe("required Army calculation test cases", () => {
  it("Test 1 — 39.5 in waist / 72 in height => 0.548 WITHIN STANDARD", () => {
    const r = calculateWhtr(72, 39.5)!;
    expect(r.display).toBe("0.548");
    expect(r.status).toBe("within");
  });

  it("Test 2 — 39.6 in waist / 72 in height => 0.550 DOES NOT MEET STANDARD", () => {
    const r = calculateWhtr(72, 39.6)!;
    expect(r.display).toBe("0.550");
    expect(r.status).toBe("fails");
  });

  it("Test 3 — raw 0.549999 displays 0.549 and is WITHIN STANDARD", () => {
    const truncated = truncateToThreeDecimals(0.549999);
    expect(truncated.toFixed(3)).toBe("0.549");
    expect(statusFromRatio(truncated)).toBe("within");
  });

  it("Test 4 — raw 0.550001 displays 0.550 and DOES NOT MEET STANDARD", () => {
    const truncated = truncateToThreeDecimals(0.550001);
    expect(truncated.toFixed(3)).toBe("0.550");
    expect(statusFromRatio(truncated)).toBe("fails");
  });

  it("Test 5 — 38.0 in waist / 70 in height => 0.542 WITHIN STANDARD", () => {
    const r = calculateWhtr(70, 38)!;
    expect(r.display).toBe("0.542");
    expect(r.status).toBe("within");
  });

  it("Test 6 — 38.5 in waist / 70 in height => 0.550 DOES NOT MEET STANDARD", () => {
    const r = calculateWhtr(70, 38.5)!;
    expect(r.display).toBe("0.550");
    expect(r.status).toBe("fails");
  });
});

describe("thresholds and margins", () => {
  it("computes the mathematical waist boundary", () => {
    expect(thresholdWaistForHeight(72)).toBeCloseTo(39.6, 10);
    expect(thresholdWaistForHeight(64)).toBeCloseTo(35.2, 10);
    expect(thresholdWaistForHeight(71)).toBeCloseTo(39.05, 10);
  });

  it("reports margin below and above the threshold", () => {
    expect(calculateWhtr(72, 39.5)!.margin).toBeCloseTo(0.1, 10);
    expect(calculateWhtr(72, 40)!.margin).toBeCloseTo(-0.4, 10);
  });

  it("steps the half-inch increment down when it lands on the boundary", () => {
    expect(highestHalfIncrementBelow(39.6)).toBe(39.5);
    expect(highestHalfIncrementBelow(38.5)).toBe(38);
    expect(highestHalfIncrementBelow(35.2)).toBe(35);
    expect(highestHalfIncrementBelow(40.15)).toBe(40);
  });

  it("keeps every table increment strictly within standard", () => {
    const rows = buildThresholdTable(54, 84);
    expect(rows).toHaveLength(31);
    for (const row of rows) {
      const r = calculateWhtr(row.heightInches, row.highestHalfIncrement)!;
      expect(r.status).toBe("within");
      const atBoundary = calculateWhtr(row.heightInches, row.thresholdWaist)!;
      expect(atBoundary.status).toBe("fails");
    }
  });

  it("matches the published reference rows", () => {
    const rows = buildThresholdTable(64, 76);
    const row72 = rows.find((r) => r.heightInches === 72)!;
    expect(row72.heightFeetInches).toBe("6'0\"");
    expect(row72.thresholdWaist.toFixed(2)).toBe("39.60");
    expect(row72.highestHalfIncrement).toBe(39.5);
  });
});

describe("units", () => {
  it("converts feet/inches and centimeters", () => {
    expect(feetInchesToInches(6, 0)).toBe(72);
    expect(feetInchesToInches(5, 10.5)).toBe(70.5);
    expect(cmToInches(182.88)).toBeCloseTo(72, 6);
    expect(formatFeetInches(70.5)).toBe("5'10.5\"");
  });

  it("produces the same status in metric and imperial", () => {
    const imperial = calculateWhtr(72, 39.5)!;
    const metric = calculateWhtr(182.88, 100.33)!;
    expect(metric.status).toBe(imperial.status);
  });
});

describe("validation", () => {
  it("rejects empty, non-numeric, zero, negative and impossible values", () => {
    expect(validateMeasurement("", "height", "imperial", "Height")).toMatch(/Enter/);
    expect(validateMeasurement("abc", "height", "imperial", "Height")).toMatch(/number/);
    expect(validateMeasurement("-5", "waist", "imperial", "Waist")).toMatch(/number/);
    expect(validateMeasurement("0", "height", "imperial", "Height")).toMatch(/greater than zero/);
    expect(validateMeasurement("500", "height", "imperial", "Height")).toMatch(/between/);
    expect(validateMeasurement("2", "waist", "imperial", "Waist")).toMatch(/between/);
    expect(validateMeasurement("72", "height", "imperial", "Height")).toBeNull();
    expect(validateMeasurement("182.9", "height", "metric", "Height")).toBeNull();
  });

  it("returns null for invalid calculations", () => {
    expect(calculateWhtr(0, 39)).toBeNull();
    expect(calculateWhtr(72, 0)).toBeNull();
    expect(calculateWhtr(NaN, 39)).toBeNull();
  });
});

describe("compare measurements", () => {
  it("averages usable measurements only", () => {
    expect(averageMeasurements([39, 39.5, 40])).toBeCloseTo(39.5, 10);
    expect(averageMeasurements([39, NaN, 0])).toBe(39);
    expect(averageMeasurements([])).toBeNull();
  });
});
