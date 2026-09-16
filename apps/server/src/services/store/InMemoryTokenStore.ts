import fs from "fs";
import path from "path";

export interface TokenRecord {
  tokenId: string;
  auditLogId: string;
  decidedAt: string;
  decision: "approved" | "flagged_for_review" | "rejected";
}

/**
 * Only APPROVED tokens block a future duplicate — a rejected or
 * still-flagged token should not permanently lock out a corrected
 * resubmission of the same physical gate pass.
 */
export class TokenStore {
  private approvedTokens = new Map<string, TokenRecord>();

  private readonly filePath = path.resolve(process.env.DATA_DIR ?? "./data", "approved-tokens.json");

  constructor() {
    this.load();
  }

  private normalize(tokenId: string): string {
    return tokenId.trim().toUpperCase().replace(/\s+/g, "");
  }

  checkDuplicate(tokenId: string): { isDuplicate: boolean; conflictingAuditLogId?: string } {
    const key = this.normalize(tokenId);
    const existing = this.approvedTokens.get(key);
    if (existing) {
      return { isDuplicate: true, conflictingAuditLogId: existing.auditLogId };
    }
    return { isDuplicate: false };
  }

  registerApproved(tokenId: string, auditLogId: string, decidedAt: string) {
    const key = this.normalize(tokenId);
    this.approvedTokens.set(key, { tokenId, auditLogId, decidedAt, decision: "approved" });
    this.persist();
  }

  // exposed for admin/debug endpoints
  listApproved(): TokenRecord[] {
    return Array.from(this.approvedTokens.values());
  }

  private load(): void {
    try {
      const saved = JSON.parse(fs.readFileSync(this.filePath, "utf8")) as TokenRecord[];
      for (const record of saved) this.approvedTokens.set(this.normalize(record.tokenId), record);
    } catch (error: any) {
      if (error.code !== "ENOENT") console.error("[token-store] Could not load saved tokens", error);
    }
  }

  private persist(): void {
    fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
    fs.writeFileSync(this.filePath, JSON.stringify(Array.from(this.approvedTokens.values()), null, 2));
  }
}

export const tokenStore = new TokenStore(); // process-lifetime singleton