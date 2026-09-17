import { Router } from "express";
import fs from "fs/promises";
import { uploadMiddleware } from "../middleware/fileUpload";
import { GatePassParser } from "../services/ocr/GatePassParser";
import { WeighbridgeParser } from "../services/ocr/WeighbridgeParser";
import { MockDocumentParser } from "../services/ocr/MockDocumentParser";
import { ClaudeVisionDocumentParser } from "../services/ocr/ClaudeVisionDocumentParser";
import { TesseractDocumentParser } from "../services/ocr/TesseractDocumentParser";
import { DocumentAsset } from "@shared/types/common.types";
import { sessionStore } from "../services/store/InMemorySessionStore";

const router = Router();

const parserImpl = process.env.USE_MOCK_OCR === "true"
  ? new MockDocumentParser()
  : process.env.OCR_PROVIDER === "tesseract"
  ? new TesseractDocumentParser()
  : new ClaudeVisionDocumentParser();

const gatePassParser = new GatePassParser(parserImpl);
const weighbridgeParser = new WeighbridgeParser(parserImpl);

function ensureCaseToken<T extends { fields: { tokenId: { value: string; confidence: number; source: "ocr" | "manual_override" | "system_default"; rawText: string } } }>(document: T, sessionId: string): T {
  if (document.fields.tokenId.value.trim()) return document;
  document.fields.tokenId = {
    value: `CASE-${sessionId.slice(0, 8).toUpperCase()}`,
    rawText: "",
    confidence: 0,
    source: "system_default",
  };
  return document;
}

function toDocumentAsset(file: Express.Multer.File, captureMode: "camera" | "file_upload" | "scan"): DocumentAsset {
  return {
    id: crypto.randomUUID(),
    originalFilename: file.originalname,
    mimeType: file.mimetype as DocumentAsset["mimeType"],
    storageUrl: file.path,
    uploadedAt: new Date().toISOString(),
    pageCount: file.mimetype === "application/pdf" ? 1 : 1, // refined post-parse for multi-page PDFs
    captureMode,
    imageQualityFlags: [],
  };
}

// POST /api/upload/gate-pass
router.post("/gate-pass", uploadMiddleware.single("file"), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: { message: "No file provided" } });
    const captureMode = (req.body.captureMode ?? "file_upload") as any;
    const asset = toDocumentAsset(req.file, captureMode);
    const gatePass = ensureCaseToken(await gatePassParser.parse(asset), req.body.sessionId);
    sessionStore.attachGatePass(req.body.sessionId, gatePass);
    res.status(201).json({ gatePass });
  } catch (err) {
    next(err);
  }
});

// POST /api/upload/weighbridge-slip
router.post("/weighbridge-slip", uploadMiddleware.single("file"), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: { message: "No file provided" } });
    const captureMode = (req.body.captureMode ?? "file_upload") as any;
    const asset = toDocumentAsset(req.file, captureMode);
    const weighbridgeSlip = ensureCaseToken(await weighbridgeParser.parse(asset), req.body.sessionId);
    sessionStore.attachWeighbridgeSlip(req.body.sessionId, weighbridgeSlip);
    res.status(201).json({ weighbridgeSlip });
  } catch (err) {
    next(err);
  }
});

// POST /api/upload/session  — create a new review session to pair the two uploads
router.post("/session", (_req, res) => {
  const session = sessionStore.create();
  res.status(201).json({ sessionId: session.id });
});

router.delete("/:sessionId/gate-pass", async (req, res, next) => {
  try {
    const gatePass = sessionStore.removeGatePass(req.params.sessionId);
    if (gatePass) await fs.rm(gatePass.document.storageUrl, { force: true });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

router.delete("/:sessionId/weighbridge-slip", async (req, res, next) => {
  try {
    const weighbridgeSlip = sessionStore.removeWeighbridgeSlip(req.params.sessionId);
    if (weighbridgeSlip) await fs.rm(weighbridgeSlip.document.storageUrl, { force: true });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;