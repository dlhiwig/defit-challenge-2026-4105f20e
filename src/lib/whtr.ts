/**
 * Army Waist-to-Height Ratio (WHtR) calculation utilities.
 *
 * Authority: Army Directive 2026-13, Army Body Composition Program and Standards.
 *
 * Rules implemented here:
 *  - WHtR = waist circumference / height, both in the SAME unit.
 *  - The Army records WHtR to three decimal places by TRUNCATION (digits after the
 *    third decimal place are disregarded) — never by mathematical rounding.
 *  - WHtR < 0.550 => WITHIN STANDARD. WHtR >= 0.550 => DOES NOT MEET STANDARD.
 */

/** The Army compliance limit. A recorded WHtR must remain strictly below this. */
export const ARMY_WHTR_LIMIT = 0.55;

export const IN_PER_CM = 1 / 2.54;
export const CM_PER_IN = 2.54;

export type Unit = "imperial" | "metric";
export type WhtrStatus = "within" | "fails";

export interface WhtrResult {
  /** Untruncated waist / height. */
  rawRatio: number;
  /** Army-recorded WHtR: three decimals, truncated (not rounded). */
  ratio: number;
  /** Army-recorded WHtR formatted to exactly three decimals, e.g. "0.548". */
  display: string;
  status: WhtrStatus;
  withinStandard: boolean;
  /** Mathematical waist boundary = height * 0.55, in the input unit. */
  thresholdWaist: number;
  /**
   * Signed margin in the input unit: positive means the waist is below the
   * threshold (margin available), negative means it is above the threshold.
   */
  margin: number;
}

/**
 * Truncate a ratio to three decimal places, disregarding all further digits.
 *
 * Binary floating point can represent an exact decimal like 0.550 as
 * 0.549999999999999989, which a naive Math.floor would truncate to 0.549. We
 * therefore snap values that are within 1e-9 of a three-decimal boundary before
 * truncating, so exact quotients such as 38.5 / 70 record as 0.550.
 */
export function truncateToThreeDecimals(ratio: number): number {
  if (!Number.isFinite(ratio)) return NaN;
  const scaled = ratio * 1000;
  const nearest = Math.round(scaled);
  const snapped = Math.abs(scaled - nearest) < 1e-9 ? nearest : scaled;
  return Math.floor(snapped) / 1000;
}

/** Format an Army-recorded WHtR to exactly three decimals, e.g. 0.55 -> "0.550". */
export function formatWhtr(ratio: number): string {
  if (!Number.isFinite(ratio)) return "—";
  return truncateToThreeDecimals(ratio).toFixed(3);
}

/** Determine Army compliance from an already-truncated three-decimal WHtR. */
export function statusFromRatio(truncated: number): WhtrStatus {
  return truncated < ARMY_WHTR_LIMIT ? "within" : "fails";
}

/** Mathematical maximum waist for a height: height * 0.55, same unit as height. */
export function thresholdWaistForHeight(height: number): number {
  return height * ARMY_WHTR_LIMIT;
}

/**
 * Highest half-unit increment strictly below the mathematical boundary.
 * A measurement recorded exactly at the boundary would record as 0.550, so an
 * increment landing on the boundary is stepped down.
 */
export function highestHalfIncrementBelow(threshold: number): number {
  const steps = Math.floor(threshold * 2) / 2;
  return steps >= threshold ? steps - 0.5 : steps;
}

/** Core calculation. Height and waist must be in the same unit. */
export function calculateWhtr(height: number, waist: number): WhtrResult | null {
  if (!Number.isFinite(height) || !Number.isFinite(waist)) return null;
  if (height <= 0 || waist <= 0) return null;

  const rawRatio = waist / height;
  const ratio = truncateToThreeDecimals(rawRatio);
  const thresholdWaist = thresholdWaistForHeight(height);

  return {
    rawRatio,
    ratio,
    display: ratio.toFixed(3),
    status: statusFromRatio(ratio),
    withinStandard: ratio < ARMY_WHTR_LIMIT,
    thresholdWaist,
    margin: thresholdWaist - waist,
  };
}

/* ---------------------------------------------------------------- validation */

export interface Limits {
  min: number;
  max: number;
}

export const LIMITS: Record<Unit, { height: Limits; waist: Limits }> = {
  imperial: { height: { min: 48, max: 90 }, waist: { min: 15, max: 80 } },
  metric: { height: { min: 122, max: 229 }, waist: { min: 38, max: 203 } },
};

/**
 * Validate a raw text input for a measurement field.
 * Returns an error message, or null when the value is acceptable.
 */
export function validateMeasurement(
  raw: string,
  field: "height" | "waist",
  unit: Unit,
  label: string,
): string | null {
  const trimmed = raw.trim();
  if (trimmed === "") return `Enter a ${label.toLowerCase()}.`;
  if (!/^\d*\.?\d*$/.test(trimmed)) return `${label} must be a number.`;
  const value = Number(trimmed);
  if (!Number.isFinite(value)) return `${label} must be a number.`;
  if (value <= 0) return `${label} must be greater than zero.`;
  const { min, max } = LIMITS[unit][field];
  const suffix = unit === "imperial" ? "in" : "cm";
  if (value < min || value > max) {
    return `${label} must be between ${min} and ${max} ${suffix}.`;
  }
  return null;
}

/* ------------------------------------------------------------ unit helpers */

export function feetInchesToInches(feet: number, inches: number): number {
  return feet * 12 + inches;
}

export function cmToInches(cm: number): number {
  return cm * IN_PER_CM;
}

export function inchesToCm(inches: number): number {
  return inches * CM_PER_IN;
}

export function formatFeetInches(totalInches: number): string {
  const feet = Math.floor(totalInches / 12);
  const inches = totalInches - feet * 12;
  const inchLabel = Number.isInteger(inches) ? `${inches}` : inches.toFixed(1);
  return `${feet}'${inchLabel}"`;
}

/* --------------------------------------------------------- reference table */

export interface ThresholdRow {
  heightInches: number;
  heightFeetInches: string;
  thresholdWaist: number;
  highestHalfIncrement: number;
}

/** Build the Army WHtR boundary table for a range of heights, in inches. */
export function buildThresholdTable(minInches: number, maxInches: number): ThresholdRow[] {
  const rows: ThresholdRow[] = [];
  for (let h = Math.round(minInches); h <= Math.round(maxInches); h += 1) {
    const thresholdWaist = thresholdWaistForHeight(h);
    rows.push({
      heightInches: h,
      heightFeetInches: formatFeetInches(h),
      thresholdWaist,
      highestHalfIncrement: highestHalfIncrementBelow(thresholdWaist),
    });
  }
  return rows;
}

/** Average of the supplied measurements, or null when none are usable. */
export function averageMeasurements(values: number[]): number | null {
  const usable = values.filter((v) => Number.isFinite(v) && v > 0);
  if (usable.length === 0) return null;
  return usable.reduce((sum, v) => sum + v, 0) / usable.length;
}
