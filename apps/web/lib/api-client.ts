import type { AuditLog, AuditReceipt, PayoutDecision, RejectReason } from "@shared/types/audit.types";
import type { GatePass } from "@shared/types/gate-pass.types";
import type { ReconciliationResult } from "@shared/types/reconciliation.types";
import type { WeighbridgeSlip } from "@shared/types/weighbridge.types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

async function getAuthToken(forceRefresh = false): Promise<string | null> {
  let token = typeof window !== "undefined" && !forceRefresh
    ? localStorage.getItem("mandi_session_token")
    : null;
  if (!token && typeof window !== "undefined") {
    const response = await fetch(`${BASE_URL}/dev-token`, { method: "POST" });
    const body = await response.json() as { token: string };
    token = body.token;
    localStorage.setItem("mandi_session_token", token);
  }
  return token;
}

async function authHeaders(forceRefresh = false): Promise<HeadersInit> {
  const token = await getAuthToken(forceRefresh);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handleResponse<T>(response: Response): Promise<T> {
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error?.message ?? "Request failed");
  return body as T;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = await authHeaders();
  const response = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: { ...headers, ...init.headers },
  });

  if (response.status === 401 && typeof window !== "undefined") {
    localStorage.removeItem("mandi_session_token");
    const refreshedHeaders = await authHeaders(true);
    return handleResponse<T>(await fetch(`${BASE_URL}${path}`, {
      ...init,
      headers: { ...refreshedHeaders, ...init.headers },
    }));
  }

  return handleResponse<T>(response);
}

export const apiClient = {
  createSession: () => request<{ sessionId: string }>("/upload/session", { method: "POST" }),

  removeGatePass: (sessionId: string) =>
    request<void>(`/upload/${sessionId}/gate-pass`, { method: "DELETE" }),

  removeWeighbridgeSlip: (sessionId: string) =>
    request<void>(`/upload/${sessionId}/weighbridge-slip`, { method: "DELETE" }),

  uploadGatePass: async (sessionId: string, file: File, captureMode: string) => {
    const form = new FormData();
    form.append("file", file);
    form.append("sessionId", sessionId);
    form.append("captureMode", captureMode);
    return request<{ gatePass: GatePass }>("/upload/gate-pass", { method: "POST", body: form });
  },

  uploadWeighbridgeSlip: async (sessionId: string, file: File, captureMode: string) => {
    const form = new FormData();
    form.append("file", file);
    form.append("sessionId", sessionId);
    form.append("captureMode", captureMode);
    return request<{ weighbridgeSlip: WeighbridgeSlip }>("/upload/weighbridge-slip", { method: "POST", body: form });
  },

  getReconciliation: (sessionId: string) =>
    request<{ result: ReconciliationResult }>(`/reconciliation/${sessionId}`),

  listAuditLogs: () => request<{ logs: AuditLog[] }>("/audit"),

  getReceipt: (auditLogId: string) => request<{ receipt: AuditReceipt }>(`/audit/${auditLogId}`),

  submitDecision: (input: {
    sessionId: string;
    decision: PayoutDecision;
    rejectReason?: RejectReason;
    flagNote?: string;
    netWeightApprovedKg?: number;
  }) => request<{ auditLog: AuditLog }>("/audit/decision", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  }),
};