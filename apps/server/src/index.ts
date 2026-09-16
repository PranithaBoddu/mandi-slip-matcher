import "dotenv/config";
import cors from "cors";
import express from "express";
import fs from "fs";
import jwt from "jsonwebtoken";
import path from "path";
import documentRoutes from "./routes/documents.routes";
import auditRoutes from "./routes/audit.routes";
import reconciliationRoutes from "./routes/reconciliation.routes";
import tokenRoutes from "./routes/tokens.routes";
import uploadRoutes from "./routes/upload.routes";
import { requireAuth } from "./middleware/auth";
import { errorHandler } from "./middleware/errorHandler";

const app = express();
const port = Number(process.env.PORT ?? 4000);
const uploadDir = path.resolve(process.env.UPLOAD_DIR ?? "./uploads");

fs.mkdirSync(uploadDir, { recursive: true });
app.use(cors({ origin: process.env.WEB_ORIGIN ?? "http://localhost:3000" }));
app.use(express.json());

app.get("/health", (_req, res) => res.json({ ok: true }));
app.post("/api/dev-token", (_req, res) => {
	const token = jwt.sign(
		{ agentId: "agent-001", agentName: "Local Agent", role: "agent", mandiYardCode: "MDY-HYD-07" },
		process.env.JWT_SECRET as string,
		{ expiresIn: "8h" },
	);
	res.json({ token });
});
app.use("/api/upload", requireAuth, uploadRoutes);
app.use("/api/documents", requireAuth, documentRoutes);
app.use("/api/audit", requireAuth, auditRoutes);
app.use("/api/reconciliation", requireAuth, reconciliationRoutes);
app.use("/api/tokens", requireAuth, tokenRoutes);
app.use(errorHandler);

app.listen(port, () => {
	console.log(`Mandi API listening on http://localhost:${port}`);
});