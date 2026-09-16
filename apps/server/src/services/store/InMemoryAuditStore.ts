import { AuditLog } from "@shared/types/audit.types";
import fs from "fs";
import path from "path";

export class AuditStore {
  private logs = new Map<string, AuditLog>();

  private readonly filePath = path.resolve(process.env.DATA_DIR ?? "./data", "audit-logs.json");

  constructor() {
    this.load();
  }

  save(log: AuditLog): void {
    this.logs.set(log.id, log);
    this.persist();
  }

  getById(id: string): AuditLog | undefined {
    return this.logs.get(id);
  }

  list(filter?: { decision?: AuditLog["decision"]; tokenId?: string }): AuditLog[] {
    let all = Array.from(this.logs.values());
    if (filter?.decision) all = all.filter(l => l.decision === filter.decision);
    if (filter?.tokenId) all = all.filter(l => l.tokenId === filter.tokenId);
    return all.sort((a, b) => b.decidedAt.localeCompare(a.decidedAt));
  }

  private load(): void {
    try {
      const saved = JSON.parse(fs.readFileSync(this.filePath, "utf8")) as AuditLog[];
      for (const log of saved) this.logs.set(log.id, log);
    } catch (error: any) {
      if (error.code !== "ENOENT") console.error("[audit-store] Could not load saved decisions", error);
    }
  }

  private persist(): void {
    fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
    fs.writeFileSync(this.filePath, JSON.stringify(Array.from(this.logs.values()), null, 2));
  }
}

export const auditStore = new AuditStore(); // process-lifetime singleton