import { Pool } from "pg";
import { AuditLog } from "@shared/types/audit.types";
import { IAuditStore } from "../interfaces";

export class PostgresAuditStore implements IAuditStore {
  constructor(private pool: Pool) {}

  async save(log: AuditLog): Promise<void> {
    await this.pool.query(
      `INSERT INTO audit_logs
        (id, reconciliation_result_id, gate_pass_id, weighbridge_slip_id, token_id,
         decision, agent_id, agent_name, reject_reason_code, reject_reason_note,
         flag_note, net_weight_approved_kg, snapshot, decided_at, ip_address)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`,
      [
        log.id, log.reconciliationResultId, log.gatePassId, log.weighbridgeSlipId, log.tokenId,
        log.decision, log.decidedBy.agentId, log.decidedBy.agentName,
        log.rejectReason?.code ?? null, log.rejectReason?.note ?? null,
        log.flagNote ?? null, log.netWeightApprovedKg ?? null,
        JSON.stringify(log.snapshot), log.decidedAt, log.ipAddress ?? null,
      ]
    );
  }

  async getById(id: string): Promise<AuditLog | undefined> {
    const { rows } = await this.pool.query(`SELECT * FROM audit_logs WHERE id = $1`, [id]);
    if (rows.length === 0) return undefined;
    return this.mapRow(rows[0]);
  }

  async list(filter?: { decision?: AuditLog["decision"]; tokenId?: string }): Promise<AuditLog[]> {
    const clauses: string[] = [];
    const params: any[] = [];
    if (filter?.decision) { params.push(filter.decision); clauses.push(`decision = $${params.length}`); }
    if (filter?.tokenId) { params.push(filter.tokenId); clauses.push(`token_id = $${params.length}`); }
    const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
    const { rows } = await this.pool.query(
      `SELECT * FROM audit_logs ${where} ORDER BY decided_at DESC LIMIT 200`,
      params
    );
    return rows.map(this.mapRow);
  }

  private mapRow(row: any): AuditLog {
    return {
      id: row.id,
      reconciliationResultId: row.reconciliation_result_id,
      gatePassId: row.gate_pass_id,
      weighbridgeSlipId: row.weighbridge_slip_id,
      tokenId: row.token_id,
      decision: row.decision,
      decidedBy: { agentId: row.agent_id, agentName: row.agent_name },
      rejectReason: row.reject_reason_code
        ? { code: row.reject_reason_code, note: row.reject_reason_note ?? "" }
        : undefined,
      flagNote: row.flag_note ?? undefined,
      netWeightApprovedKg: row.net_weight_approved_kg ? Number(row.net_weight_approved_kg) : undefined,
      snapshot: row.snapshot,
      decidedAt: row.decided_at.toISOString?.() ?? row.decided_at,
      ipAddress: row.ip_address ?? undefined,
    };
  }
}