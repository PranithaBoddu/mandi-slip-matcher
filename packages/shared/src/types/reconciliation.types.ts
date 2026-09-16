import { UUID, ISODateString } from "./common.types";

export type MatchStatus = "match" | "mismatch" | "warning" | "missing_data";

export type ReconciliationKey =
  | "tokenId"
  | "date"
  | "vehicleRegNumber"
  | "grossWeightKg"
  | "tareWeightKg"
  | "netWeightKg"
  | "commodityType"
  | "farmerId";

export interface FieldComparison {
  key: ReconciliationKey;
  label: string;                     // human-readable, e.g. "Net Weight (kg)"
  gatePassValue: string | number | null;
  weighbridgeValue: string | number | null;
  status: MatchStatus;
  deltaAbsolute?: number;            // numeric fields only
  deltaPercent?: number;             // numeric fields only
  toleranceApplied?: {
    type: "percentage" | "absolute" | "fuzzy_string" | "exact";
    threshold: number;               // e.g. 0.5 for ±0.5%
  };
  fuzzyMatchScore?: number;          // 0-1, for vehicle reg / string fields
  requiresManualReview: boolean;
  notes?: string;
}

export type ReconciliationVerdict =
  | "clean_match"        // all keys matched within tolerance
  | "minor_discrepancy"  // warnings only, auto-approvable with note
  | "critical_mismatch"  // hard mismatch, blocks auto-approval
  | "duplicate_token"    // token already used in a prior payout
  | "incomplete_data";   // one or both docs failed extraction

export interface ReconciliationResult {
  id: UUID;
  sessionId: UUID;
  gatePassId: UUID;
  weighbridgeSlipId: UUID;
  comparisons: FieldComparison[];
  verdict: ReconciliationVerdict;
  duplicateTokenCheck: {
    isDuplicate: boolean;
    conflictingAuditLogId?: UUID;
  };
  overallConfidence: number;         // aggregate of field confidences
  evaluatedAt: string;
  reconciliationEngineVersion: string;
}