import { Router } from "express";
import { tokenStore } from "../services/store/InMemoryTokenStore";

const router = Router();

// GET /api/tokens/check/:tokenId
router.get("/check/:tokenId", (req, res) => {
  const result = tokenStore.checkDuplicate(req.params.tokenId);
  res.json(result);
});

// GET /api/tokens  — admin/debug view of all approved tokens
router.get("/", (_req, res) => {
  res.json({ tokens: tokenStore.listApproved() });
});

export default router;