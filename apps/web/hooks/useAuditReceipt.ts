import { useState, useCallback } from "react";
import { apiClient } from "../lib/api-client";
import type { AuditReceipt } from "@shared/types/audit.types";

export function useAuditReceipt() {
  const [receipt, setReceipt] = useState<AuditReceipt | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReceipt = useCallback(async (auditLogId: string) => {
    setLoading(true);
    setError(null);
    try {
      const { receipt } = await apiClient.getReceipt(auditLogId);
      setReceipt(receipt);
      return receipt;
    } catch (err: any) {
      setError(err.message ?? "Failed to load receipt");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const downloadJson = useCallback((r: AuditReceipt) => {
    const blob = new Blob([JSON.stringify(r, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-receipt-${r.tokenId}-${r.auditLogId.slice(0, 8)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  return { receipt, loading, error, fetchReceipt, downloadJson };
}