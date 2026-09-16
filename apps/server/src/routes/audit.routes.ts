import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { auditLogger } from "../services/audit/AuditLogger";
import { auditStore } from "../services/store/InMemoryAuditStore";
import { tokenStore } from "../services/store/InMemoryTokenStore";
import { sessionStore } from "../services/store/InMemorySessionStore";
import { ReconciliationEngine } from "../services/matching/ReconciliationEngine";

const router = Router();
const engine = new ReconciliationEngine(tokenStore);

// POST /api/audit/decision
// body no longer accepts agentId/agentName from the client — they come from the verified JWT.
router.post("/decision", requireAuth, async (req, res, next) => {
  try {
    const { sessionId, decision, rejectReason, flagNote, netWeightApprovedKg } = req.body;
    const { agentId, agentName } = req.agent!; // trusted, server-verified identity

    const session = sessionStore.get(sessionId);
    if (!session.gatePass || !session.weighbridgeSlip) {
      return res.status(409).json({ error: { message: "Session incomplete — both documents required." } });
    }

    const reconciliation = engine.evaluate(session.gatePass, session.weighbridgeSlip, sessionId);

    if (decision === "approved" && reconciliation.verdict === "critical_mismatch") {
      return res.status(422).json({ error: { message: "Cannot approve: critical mismatch detected.", code: "CRITICAL_MISMATCH" } });
    }
    if (decision === "approved" && reconciliation.verdict === "duplicate_token") {
      return res.status(409).json({ error: { message: "Cannot approve: duplicate token already paid out.", code: "DUPLICATE_TOKEN" } });
    }

    const log = await auditLogger.record({
      reconciliation,
      gatePassId: session.gatePass.id,
      weighbridgeSlipId: session.weighbridgeSlip.id,
      tokenId: session.gatePass.fields.tokenId.value,
      decision, agentId, agentName, rejectReason, flagNote, netWeightApprovedKg,
      ipAddress: req.ip,
    });

    res.status(201).json({ auditLog: log });
  } catch (err: any) {
    if (err.code === "DUPLICATE_TOKEN_RACE") {
      return res.status(409).json({ error: { message: err.message, code: "DUPLICATE_TOKEN_RACE" } });
    }
    next(err);
  }
});

router.get("/", (_req, res) => {
  res.json({ logs: auditStore.list() });
});

router.get("/:auditId", (req, res) => {
  const log = auditStore.getById(req.params.auditId);
  if (!log) return res.status(404).json({ error: { message: "Audit log not found" } });

  const session = sessionStore.get(log.snapshot.sessionId);
  res.json({
    receipt: {
      auditLogId: log.id,
      tokenId: log.tokenId,
      farmerName: session.gatePass?.fields.farmerName.value ?? "",
      vehicleRegNumber: session.gatePass?.fields.vehicleRegNumber.value ?? "",
      netWeightKg: session.weighbridgeSlip?.fields.netWeightKg.value ?? 0,
      decision: log.decision,
      decidedAt: log.decidedAt,
      agentName: log.decidedBy.agentName,
      discrepancySummary: log.snapshot.comparisons
        .filter(comparison => comparison.status !== "match")
        .map(comparison => `${comparison.label}: ${comparison.status}`),
      documentThumbnails: {
        gatePassUrl: `/api/documents/${log.gatePassId}/image?page=1`,
        weighbridgeSlipUrl: `/api/documents/${log.weighbridgeSlipId}/image?page=1`,
      },
    },
  });
});

export default router;