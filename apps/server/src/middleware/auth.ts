import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthenticatedAgent {
  agentId: string;
  agentName: string;
  role: "agent" | "supervisor" | "admin";
  mandiYardCode?: string;
}

declare global {
  namespace Express {
    interface Request {
      agent?: AuthenticatedAgent;
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  // Fail fast at boot rather than silently accepting unverifiable tokens.
  throw new Error("JWT_SECRET is not set — refusing to start with an insecure auth configuration.");
}

/** Verifies the bearer token and attaches the authenticated agent identity
 *  to the request. Nothing downstream trusts client-supplied agentId/agentName again. */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: { message: "Missing or malformed Authorization header", code: "UNAUTHENTICATED" } });
  }

  const token = header.slice("Bearer ".length);
  try {
    const payload = jwt.verify(token, JWT_SECRET as string) as AuthenticatedAgent & { iat: number; exp: number };
    req.agent = { agentId: payload.agentId, agentName: payload.agentName, role: payload.role, mandiYardCode: payload.mandiYardCode };
    next();
  } catch (err) {
    return res.status(401).json({ error: { message: "Invalid or expired session token", code: "TOKEN_INVALID" } });
  }
}

/** Restricts an endpoint to specific roles — e.g. only supervisors can review flagged items. */
export function requireRole(...allowed: AuthenticatedAgent["role"][]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.agent || !allowed.includes(req.agent.role)) {
      return res.status(403).json({ error: { message: "Insufficient permissions for this action", code: "FORBIDDEN" } });
    }
    next();
  };
}