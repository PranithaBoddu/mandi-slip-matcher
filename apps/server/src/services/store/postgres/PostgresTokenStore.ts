import { Pool } from "pg";
import { ITokenStore } from "../interfaces";

/**
 * Production-grade replacement for InMemoryTokenStore. The UNIQUE constraint
 * on token_id in the schema below is the real duplicate-prevention backstop —
 * the app-level check is a fast pre-flight, but the DB constraint is what
 * actually guarantees correctness under concurrent requests across
 * multiple server instances (something no in-memory Map could ever do).
 */
export class PostgresTokenStore implements ITokenStore {
  constructor(private pool: Pool) {}

  private normalize(tokenId: string): string {
    return tokenId.trim().toUpperCase().replace(/\s+/g, "");
  }

  async checkDuplicate(tokenId: string) {
    const key = this.normalize(tokenId);
    const { rows } = await this.pool.query(
      `SELECT audit_log_id FROM approved_tokens WHERE token_id = $1 LIMIT 1`,
      [key]
    );
    if (rows.length === 0) return { isDuplicate: false };
    return { isDuplicate: true, conflictingAuditLogId: rows[0].audit_log_id };
  }

  async registerApproved(tokenId: string, auditLogId: string, decidedAt: string) {
    const key = this.normalize(tokenId);
    // ON CONFLICT DO NOTHING + row-count check surfaces the race explicitly,
    // rather than silently overwriting a concurrent approval.
    const result = await this.pool.query(
      `INSERT INTO approved_tokens (token_id, audit_log_id, decided_at)
       VALUES ($1, $2, $3)
       ON CONFLICT (token_id) DO NOTHING`,
      [key, auditLogId, decidedAt]
    );
    if (result.rowCount === 0) {
      const err: any = new Error(`Token ${tokenId} was approved concurrently by another request.`);
      err.status = 409;
      err.code = "DUPLICATE_TOKEN_RACE";
      throw err;
    }
  }

  async listApproved() {
    const { rows } = await this.pool.query(
      `SELECT token_id AS "tokenId", audit_log_id AS "auditLogId", decided_at AS "decidedAt"
       FROM approved_tokens ORDER BY decided_at DESC LIMIT 500`
    );
    return rows;
  }
}