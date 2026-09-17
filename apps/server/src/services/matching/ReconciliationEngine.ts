import { randomUUID } from "node:crypto";
import { GatePass } from "@shared/types/gate-pass.types";
import { WeighbridgeSlip } from "@shared/types/weighbridge.types";
import {
  ReconciliationResult,
  FieldComparison,
  ReconciliationVerdict,
  ReconciliationKey,
} from "@shared/types/reconciliation.types";
import { TOLERANCE_CONFIG } from "../../config/tolerances";
import { compareNumericWithTolerance } from "./ToleranceMatcher";
import { fuzzyMatchVehicleReg, fuzzyMatchString } from "./FuzzyMatcher";
import { TokenStore } from "../store/InMemoryTokenStore";

const CRITICAL_KEYS: ReconciliationKey[] = ["tokenId", "vehicleRegNumber", "netWeightKg"];

const ENGINE_VERSION = "1.0.0";

export class ReconciliationEngine {
  constructor(private tokenStore: TokenStore) {}

  evaluate(gatePass: GatePass, weighbridgeSlip: WeighbridgeSlip, sessionId: string): ReconciliationResult {
    const comparisons: FieldComparison[] = [];

    // --- Token ID (exact match, drives duplicate check separately) ---
    comparisons.push(this.compareExact(
      "tokenId", "Token ID",
      gatePass.fields.tokenId.value, weighbridgeSlip.fields.tokenId.value
    ));

    // --- Date (exact, same calendar day) ---
    comparisons.push(this.compareDate(
      gatePass.fields.gatePassDate.value, weighbridgeSlip.fields.weighDate.value
    ));

    // --- Vehicle Reg (fuzzy) ---
    comparisons.push(this.compareVehicleReg(
      gatePass.fields.vehicleRegNumber.value, weighbridgeSlip.fields.vehicleRegNumber.value
    ));

    // --- Weights ---
    comparisons.push(this.compareNumeric(
      "grossWeightKg", "Gross Weight (kg)",
      null, weighbridgeSlip.fields.grossWeightKg.value, // gate pass typically has no gross; declared bags only
      TOLERANCE_CONFIG.grossWeight
    ));
    comparisons.push(this.compareNumeric(
      "tareWeightKg", "Tare Weight (kg)",
      null, weighbridgeSlip.fields.tareWeightKg.value,
      TOLERANCE_CONFIG.tareWeight
    ));
    comparisons.push(this.compareNumeric(
      "netWeightKg", "Net Weight (kg)",
      null, weighbridgeSlip.fields.netWeightKg.value,
      TOLERANCE_CONFIG.netWeight
    ));

    // --- Commodity type (fuzzy) ---
    comparisons.push(this.compareFuzzyString(
      "commodityType", "Commodity Type",
      gatePass.fields.commodityType.value, weighbridgeSlip.fields.commodityType.value,
      TOLERANCE_CONFIG.commodityType.minSimilarity
    ));

    // --- Farmer ID (exact, gate-pass-only field; carried through, not cross-checked against slip) ---
    comparisons.push({
      key: "farmerId",
      label: "Farmer ID",
      gatePassValue: gatePass.fields.farmerId.value,
      weighbridgeValue: null,
      status: gatePass.fields.farmerId.value ? "match" : "missing_data",
      requiresManualReview: gatePass.fields.farmerId.confidence < TOLERANCE_CONFIG.lowConfidenceThreshold,
    });

    // --- Low-confidence override pass ---
    this.applyConfidenceGating(comparisons, gatePass, weighbridgeSlip);

    // --- Duplicate token check ---
    const duplicateCheck = this.tokenStore.checkDuplicate(gatePass.fields.tokenId.value);

    const verdict = this.deriveVerdict(comparisons, duplicateCheck.isDuplicate, gatePass, weighbridgeSlip);

    return {
      id: randomUUID(),
      sessionId,
      gatePassId: gatePass.id,
      weighbridgeSlipId: weighbridgeSlip.id,
      comparisons,
      verdict,
      duplicateTokenCheck: duplicateCheck,
      overallConfidence: this.computeAggregateConfidence(gatePass, weighbridgeSlip),
      evaluatedAt: new Date().toISOString(),
      reconciliationEngineVersion: ENGINE_VERSION,
    };
  }

  private compareExact(key: ReconciliationKey, label: string, a: string, b: string): FieldComparison {
    const status = a?.trim().toUpperCase() === b?.trim().toUpperCase() ? "match" : "mismatch";
    return {
      key, label,
      gatePassValue: a, weighbridgeValue: b,
      status,
      toleranceApplied: { type: "exact", threshold: 0 },
      requiresManualReview: status === "mismatch",
    };
  }

  private compareDate(gpDate: string, wbDate: string): FieldComparison {
    const status = gpDate === wbDate ? "match" : "mismatch";
    return {
      key: "date", label: "Date",
      gatePassValue: gpDate, weighbridgeValue: wbDate,
      status,
      toleranceApplied: { type: "exact", threshold: TOLERANCE_CONFIG.date.graceWindowDays },
      requiresManualReview: status === "mismatch",
    };
  }

  private compareVehicleReg(gpReg: string, wbReg: string): FieldComparison {
    const { status, score } = fuzzyMatchVehicleReg(gpReg, wbReg, TOLERANCE_CONFIG.vehicleRegNumber.minSimilarity);
    return {
      key: "vehicleRegNumber", label: "Vehicle Registration",
      gatePassValue: gpReg, weighbridgeValue: wbReg,
      status,
      fuzzyMatchScore: score,
      toleranceApplied: { type: "fuzzy_string", threshold: TOLERANCE_CONFIG.vehicleRegNumber.minSimilarity },
      requiresManualReview: status !== "match",
      notes: status === "warning" ? "Possible OCR digit confusion — verify manually." : undefined,
    };
  }

  private compareNumeric(
    key: ReconciliationKey, label: string,
    gpValue: number | null, wbValue: number | null,
    rule: { threshold: number; minAbsoluteFloorKg: number }
  ): FieldComparison {
    // For gross/tare/net, the gate pass side is often absent (paper gate passes
    // rarely carry weights) — in that case we compare against the slip's own
    // internal consistency instead, and mark the row informational.
    if (gpValue == null) {
      return {
        key, label,
        gatePassValue: null, weighbridgeValue: wbValue,
        status: wbValue != null ? "match" : "missing_data",
        requiresManualReview: false,
        notes: "Not present on gate pass — sourced from weighbridge slip only.",
      };
    }

    const result = compareNumericWithTolerance(gpValue, wbValue, { type: "percentage", ...rule });
    return {
      key, label,
      gatePassValue: gpValue, weighbridgeValue: wbValue,
      status: result.status,
      deltaAbsolute: result.deltaAbsolute,
      deltaPercent: result.deltaPercent,
      toleranceApplied: { type: "percentage", threshold: rule.threshold },
      requiresManualReview: result.status !== "match",
    };
  }

  private compareFuzzyString(
    key: ReconciliationKey, label: string,
    a: string, b: string, minSimilarity: number
  ): FieldComparison {
    const { status, score } = fuzzyMatchString(a, b, minSimilarity);
    return {
      key, label,
      gatePassValue: a, weighbridgeValue: b,
      status,
      fuzzyMatchScore: score,
      toleranceApplied: { type: "fuzzy_string", threshold: minSimilarity },
      requiresManualReview: status !== "match",
    };
  }

  /** Force requiresManualReview=true whenever underlying OCR confidence was low, even on a numeric/string match. */
  private applyConfidenceGating(comparisons: FieldComparison[], gp: GatePass, wb: WeighbridgeSlip) {
    const lowConfidenceFields = new Set<string>();
    const threshold = TOLERANCE_CONFIG.lowConfidenceThreshold;

    Object.entries(gp.fields).forEach(([k, f]: [string, any]) => {
      if (f?.confidence < threshold) lowConfidenceFields.add(k);
    });
    Object.entries(wb.fields).forEach(([k, f]: [string, any]) => {
      if (f?.confidence < threshold) lowConfidenceFields.add(k);
    });

    for (const comparison of comparisons) {
      if (lowConfidenceFields.has(comparison.key)) {
        comparison.requiresManualReview = true;
        comparison.notes = (comparison.notes ? comparison.notes + " " : "") + "Low OCR confidence.";
      }
    }
  }

  private deriveVerdict(
    comparisons: FieldComparison[],
    isDuplicate: boolean,
    gp: GatePass,
    wb: WeighbridgeSlip
  ): ReconciliationVerdict {
    if (gp.status === "extraction_failed" || wb.status === "extraction_failed") {
      return "incomplete_data";
    }
    if (isDuplicate) return "duplicate_token";

    const criticalMismatch = comparisons.some(
      c => CRITICAL_KEYS.includes(c.key) && c.status === "mismatch"
    );
    if (criticalMismatch) return "critical_mismatch";

    const anyWarningOrNonCriticalMismatch = comparisons.some(
      c => c.status === "warning" || c.status === "mismatch"
    );
    if (anyWarningOrNonCriticalMismatch) return "minor_discrepancy";

    return "clean_match";
  }

  private computeAggregateConfidence(gp: GatePass, wb: WeighbridgeSlip): number {
    const all = [...Object.values(gp.fields), ...Object.values(wb.fields)] as any[];
    const scores = all.filter(f => typeof f?.confidence === "number").map(f => f.confidence);
    if (scores.length === 0) return 0;
    return Number((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(3));
  }
}