import { Pool } from "pg";
import { ITokenStore, IAuditStore, ISessionStore } from "./interfaces";
import { TokenStore as InMemoryTokenStore } from "./InMemoryTokenStore";
import { AuditStore as InMemoryAuditStore } from "./InMemoryAuditStore";
import { SessionStore as InMemorySessionStoreClass } from "./InMemorySessionStore";
import { PostgresTokenStore } from "./postgres/PostgresTokenStore";
import { PostgresAuditStore } from "./postgres/PostgresAuditStore";

/**
 * Single switchboard for storage backend selection. Flip PERSISTENCE_DRIVER
 * in env to move from local/dev in-memory stores to Postgres without
 * touching a single route or service file — everything depends on the
 * interfaces in interfaces.ts, not the concrete classes.
 */
export function buildStores(): { tokenStore: ITokenStore; auditStore: IAuditStore; sessionStore: ISessionStore } {
  const driver = process.env.PERSISTENCE_DRIVER ?? "memory";

  if (driver === "postgres") {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    return {
      tokenStore: new PostgresTokenStore(pool),
      auditStore: new PostgresAuditStore(pool),
      sessionStore: new InMemorySessionStoreClass() as unknown as ISessionStore, // sessions are ephemeral pre-decision; DB-backing optional (see note below)
    };
  }

  return {
    tokenStore: new InMemoryTokenStore() as unknown as ITokenStore,
    auditStore: new InMemoryAuditStore() as unknown as IAuditStore,
    sessionStore: new InMemorySessionStoreClass() as unknown as ISessionStore,
  };
}