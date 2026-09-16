import { MatchStatus } from "@shared/types/reconciliation.types";

export interface NumericToleranceResult {
  status: MatchStatus;
  deltaAbsolute: number;
  deltaPercent: number;
}

interface NumericToleranceRule {
  type: "percentage";
  threshold: number;        // e.g. 0.5 => 0.5%
  minAbsoluteFloorKg: number;
}

/**
 * Compares two numeric weight readings against a percentage-band tolerance,
 * with an absolute-kg floor so tiny loads (e.g. 10kg samples) aren't
 * false-flagged by percentage rounding.
 */
export function compareNumericWithTolerance(
  gatePassValue: number | null,
  weighbridgeValue: number | null,
  rule: NumericToleranceRule
): NumericToleranceResult {
  if (gatePassValue == null || weighbridgeValue == null) {
    return { status: "missing_data", deltaAbsolute: 0, deltaPercent: 0 };
  }

  const deltaAbsolute = Math.abs(gatePassValue - weighbridgeValue);
  const base = Math.max(gatePassValue, weighbridgeValue, 1); // avoid div-by-zero
  const deltaPercent = (deltaAbsolute / base) * 100;

  const allowedByPercent = (rule.threshold / 100) * base;
  const effectiveAllowance = Math.max(allowedByPercent, rule.minAbsoluteFloorKg);

  if (deltaAbsolute <= effectiveAllowance) {
    return { status: "match", deltaAbsolute, deltaPercent };
  }

  // Within 1.5x the allowance => warning (borderline, agent should eyeball it)
  if (deltaAbsolute <= effectiveAllowance * 1.5) {
    return { status: "warning", deltaAbsolute, deltaPercent };
  }

  return { status: "mismatch", deltaAbsolute, deltaPercent };
}

/**
 * Net weight gets an additional internal consistency check:
 * does gross - tare actually equal the declared net, on EACH slip
 * independently? A slip where net != gross - tare suggests tampering
 * on that single document, separate from cross-document mismatches.
 */
export function checkInternalWeightConsistency(
  gross: number,
  tare: number,
  declaredNet: number,
  toleranceKg = 2
): { consistent: boolean; computedNet: number; deviationKg: number } {
  const computedNet = gross - tare;
  const deviationKg = Math.abs(computedNet - declaredNet);
  return {
    consistent: deviationKg <= toleranceKg,
    computedNet,
    deviationKg,
  };
}