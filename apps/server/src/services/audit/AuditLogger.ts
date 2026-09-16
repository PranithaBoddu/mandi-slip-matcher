import { AuditLog, PayoutDecision, RejectReason } from "@shared/types/audit.types";
import { ReconciliationResult } from "@shared/types/reconciliation.types";
import { auditStore } from "../store/InMemoryAuditStore";
import { tokenStore } from "../store/InMemoryTokenStore";

interface RecordDecisionInput {
  reconciliation: ReconciliationResult;
  gatePassId: string;
  weighbridgeSlipId: string;
  tokenId: string;
  decision: PayoutDecision;
  agentId: string;
  agentName: string;
  rejectReason?: RejectReason;
  flagNote?: string;
  netWeightApprovedKg?: number;
  ipAddress?: string;
}

export class AuditLogger {
  record(input: RecordDecisionInput): AuditLog {
    // Guardrail: engine already checks duplicates at eval time, but we
    // re-verify here immediately before commit to close the race window
    // between reconciliation and the agent clicking Approve.
    if (input.decision === "approved") {
      const dupe = tokenStore.checkDuplicate(input.tokenId);
      if (dupe.isDuplicate) {
        throw new Error(
          `Cannot approve: token ${input.tokenId} was already approved (audit log ${dupe.conflictingAuditLogId}).`
        );
      }
    }

    const log: AuditLog = {
      id: crypto.randomUUID(),
      reconciliationResultId: input.reconciliation.id,
      gatePassId: input.gatePassId,
      weighbridgeSlipId: input.weighbridgeSlipId,
      tokenId: input.tokenId,
      decision: input.decision,
      decidedBy: { agentId: input.agentId, agentName: input.agentName },
      rejectReason: input.rejectReason,
      flagNote: input.flagNote,
      netWeightApprovedKg: input.netWeightApprovedKg,
      snapshot: input.reconciliation, // immutable freeze of the evaluated state
      decidedAt: new Date().toISOString(),
      ipAddress: input.ipAddress,
    };

    auditStore.save(log);

    if (input.decision === "approved") {
      tokenStore.registerApproved(input.tokenId, log.id, log.decidedAt);
    }

    return log;
  }
}

export const auditLogger = new AuditLogger();