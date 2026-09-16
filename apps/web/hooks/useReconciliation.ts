import { useState, useCallback } from "react";
import { apiClient } from "../lib/api-client";
import type { ReconciliationResult } from "@shared/types/reconciliation.types";

export function useReconciliation(sessionId: string | null) {
  const [result, setResult] = useState<ReconciliationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runReconciliation = useCallback(async () => {
    if (!sessionId) return;
    setLoading(true);
    setError(null);
    try {
      const { result } = await apiClient.getReconciliation(sessionId);
      setResult(result);
    } catch (err: any) {
      setError(err.message ?? "Reconciliation failed");
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  return { result, loading, error, runReconciliation };
}