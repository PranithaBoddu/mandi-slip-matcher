import { GatePass } from "@shared/types/gate-pass.types";
import { WeighbridgeSlip } from "@shared/types/weighbridge.types";

interface ReviewSession {
  id: string;
  gatePass?: GatePass;
  weighbridgeSlip?: WeighbridgeSlip;
  createdAt: string;
}

export class SessionStore {
  private sessions = new Map<string, ReviewSession>();

  create(): ReviewSession {
    const session: ReviewSession = { id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    this.sessions.set(session.id, session);
    return session;
  }

  attachGatePass(sessionId: string, gatePass: GatePass) {
    const s = this.require(sessionId);
    s.gatePass = gatePass;
  }

  attachWeighbridgeSlip(sessionId: string, slip: WeighbridgeSlip) {
    const s = this.require(sessionId);
    s.weighbridgeSlip = slip;
  }

  removeGatePass(sessionId: string): GatePass | undefined {
    const s = this.require(sessionId);
    const previous = s.gatePass;
    delete s.gatePass;
    return previous;
  }

  removeWeighbridgeSlip(sessionId: string): WeighbridgeSlip | undefined {
    const s = this.require(sessionId);
    const previous = s.weighbridgeSlip;
    delete s.weighbridgeSlip;
    return previous;
  }

  get(sessionId: string): ReviewSession {
    return this.require(sessionId);
  }

  isReadyForReconciliation(sessionId: string): boolean {
    const s = this.require(sessionId);
    return !!s.gatePass && !!s.weighbridgeSlip;
  }

  private require(sessionId: string): ReviewSession {
    const s = this.sessions.get(sessionId);
    if (!s) {
      const err: any = new Error(`Session ${sessionId} not found`);
      err.status = 404;
      throw err;
    }
    return s;
  }
}

export const sessionStore = new SessionStore();