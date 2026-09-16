import { GatePass } from "@shared/types/gate-pass.types";
import { WeighbridgeSlip } from "@shared/types/weighbridge.types";
import { AuditLog } from "@shared/types/audit.types";

export interface ReviewSessionRecord {
  id: string;
  gatePass?: GatePass;
  weighbridgeSlip?: WeighbridgeSlip;
  createdAt: string;
  createdByAgentId?: string;
}

/** Every store implementation (in-memory or DB-backed) satisfies these contracts,
 *  so routes/services never need to know which backend is live. */
export interface ISessionStore {
  create(agentId?: string): Promise<ReviewSessionRecord>;
  attachGatePass(sessionId: string, gatePass: GatePass): Promise<void>;
  attachWeighbridgeSlip(sessionId: string, slip: WeighbridgeSlip): Promise<void>;
  get(sessionId: string): Promise<ReviewSessionRecord>;
  isReadyForReconciliation(sessionId: string): Promise<boolean>;
}

export interface ITokenStore {
  checkDuplicate(tokenId: string): Promise<{ isDuplicate: boolean; conflictingAuditLogId?: string }>;
  registerApproved(tokenId: string, auditLogId: string, decidedAt: string): Promise<void>;
  listApproved(): Promise<Array<{ tokenId: string; auditLogId: string; decidedAt: string }>>;
}

export interface IAuditStore {
  save(log: AuditLog): Promise<void>;
  getById(id: string): Promise<AuditLog | undefined>;
  list(filter?: { decision?: AuditLog["decision"]; tokenId?: string }): Promise<AuditLog[]>;
}