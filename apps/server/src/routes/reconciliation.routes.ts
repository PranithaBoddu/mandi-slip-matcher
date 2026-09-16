import { Router } from "express";
import { ReconciliationEngine } from "../services/matching/ReconciliationEngine";
import { tokenStore } from "../services/store/InMemoryTokenStore";
import { sessionStore } from "../services/store/InMemorySessionStore";

const router = Router();
const engine = new ReconciliationEngine(tokenStore);

// GET /api/reconciliation/:sessionId
router.get("/:sessionId", async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    if (!sessionStore.isReadyForReconciliation(sessionId)) {
      return res.status(409).json({
        error: { message: "Both documents must be uploaded and extracted before reconciliation." },
      });
    }
    const session = sessionStore.get(sessionId);
    const result = engine.evaluate(session.gatePass!, session.weighbridgeSlip!, sessionId);
    res.json({ result, gatePass: session.gatePass, weighbridgeSlip: session.weighbridgeSlip });
  } catch (err) {
    next(err);
  }
});

export default router;