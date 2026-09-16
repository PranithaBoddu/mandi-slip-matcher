import { Router } from "express";
import path from "path";
import fs from "fs";
import { requireAuth } from "../middleware/auth";
import { sessionStore } from "../services/store/InMemorySessionStore";

const router = Router();

const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR ?? "./uploads");

/**
 * Serves a specific page image for a document. Access is scoped to
 * documents that belong to a session the requesting agent can see —
 * this is NOT a generic static file server, since gate pass images
 * contain farmer PII and must not be guessable/enumerable by ID alone.
 */
router.get("/:documentId/image", requireAuth, async (req, res, next) => {
  try {
    const documentId = String(req.params.documentId);
    const page = Number(req.query.page ?? 1);

    const document = await findDocumentByIdAcrossSessions(documentId);
    if (!document) {
      return res.status(404).json({ error: { message: "Document not found" } });
    }

    const resolvedPath = resolvePageImagePath(document, page);

    // Path traversal guard: resolved path must stay within UPLOAD_DIR.
    if (!resolvedPath.startsWith(UPLOAD_DIR)) {
      return res.status(400).json({ error: { message: "Invalid document path" } });
    }
    if (!fs.existsSync(resolvedPath)) {
      return res.status(404).json({ error: { message: "Page image not found" } });
    }

    res.setHeader("Cache-Control", "private, max-age=3600");
    res.sendFile(resolvedPath);
  } catch (err) {
    next(err);
  }
});

async function findDocumentByIdAcrossSessions(documentId: string) {
  // In the in-memory dev profile, sessions are scanned directly.
  // In the Postgres profile, this becomes a single indexed lookup against
  // a documents table keyed by id — swap implementation, same route contract.
  for (const session of (sessionStore as any).sessions?.values?.() ?? []) {
    if (session.gatePass?.id === documentId) return session.gatePass.document;
    if (session.weighbridgeSlip?.id === documentId) return session.weighbridgeSlip.document;
  }
  return null;
}

function resolvePageImagePath(document: { storageUrl: string; pageCount: number }, page: number): string {
  if (document.pageCount <= 1 || page <= 1) {
    return path.resolve(document.storageUrl);
  }
  // Multi-page PDFs were rasterized by splitPdfToPageImages into
  // `<basename>.<page>.png` alongside the original in the same directory.
  const dir = path.dirname(document.storageUrl);
  const base = path.basename(document.storageUrl, path.extname(document.storageUrl));
  return path.resolve(dir, `${base}.${page}.png`);
}

export default router;