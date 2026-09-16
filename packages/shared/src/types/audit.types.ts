import { UUID, ISODateString } from "./common.types";
import { ReconciliationResult } from "./reconciliation.types";

export type PayoutDecision = "approved" | "flagged_for_review" | "rejected";

export interface RejectReason {
  code:
    | "duplicate_token"
    | "weight_tampering_suspected"
    | "vehicle_mismatch"
    | "date_mismatch"
    | "illegible_document"
    | "farmer_id_mismatch"
    | "other";
  note: string;
}

export interface AuditLog {
  id: UUID;
  reconciliationResultId: UUID;
  gatePassId: UUID;
  weighbridgeSlipId: UUID;
  tokenId: string;
  decision: PayoutDecision;
  decidedBy: {
    agentId: string;
    agentName: string;
  };
  rejectReason?: RejectReason;
  flagNote?: string;
  netWeightApprovedKg?: number;
  snapshot: ReconciliationResult;   // frozen copy at decision time, for immutability
  decidedAt: string;                // ISO timestamp
  ipAddress?: string;
  exportedReceiptUrl?: string;      // JSON/print receipt artifact
}

export interface AuditReceipt {
  auditLogId: UUID;
  tokenId: string;
  farmerName: string;
  vehicleRegNumber: string;
  netWeightKg: number;
  decision: PayoutDecision;
  decidedAt: string;
  agentName: string;
  discrepancySummary: string[];     // human-readable bullet list
  documentThumbnails: {
    gatePassUrl: string;
    weighbridgeSlipUrl: string;
  };
}