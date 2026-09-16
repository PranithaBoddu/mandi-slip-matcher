CREATE TABLE IF NOT EXISTS approved_tokens (
  token_id      TEXT PRIMARY KEY,        -- normalized, uppercase, no whitespace
  audit_log_id  UUID NOT NULL,
  decided_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS review_sessions (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gate_pass          JSONB,
  weighbridge_slip   JSONB,
  created_by_agent_id TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reconciliation_result_id    UUID NOT NULL,
  gate_pass_id                UUID NOT NULL,
  weighbridge_slip_id         UUID NOT NULL,
  token_id                    TEXT NOT NULL,
  decision                    TEXT NOT NULL CHECK (decision IN ('approved','flagged_for_review','rejected')),
  agent_id                    TEXT NOT NULL,
  agent_name                  TEXT NOT NULL,
  reject_reason_code          TEXT,
  reject_reason_note          TEXT,
  flag_note                   TEXT,
  net_weight_approved_kg      NUMERIC,
  snapshot                    JSONB NOT NULL,   -- frozen ReconciliationResult
  decided_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_address                  TEXT
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_token_id ON audit_logs (token_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_decision ON audit_logs (decision);