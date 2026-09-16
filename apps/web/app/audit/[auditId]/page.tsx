"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { useAuditReceipt } from "../../../hooks/useAuditReceipt";
import { AuditReceiptView } from "../../../components/audit/AuditReceiptView";

export default function AuditReceiptPage() {
  const { auditId } = useParams<{ auditId: string }>();
  const { receipt, loading, error, fetchReceipt, downloadJson } = useAuditReceipt();

  useEffect(() => { fetchReceipt(auditId); }, [auditId, fetchReceipt]);

  if (loading) return <div className="p-8 text-center text-gray-500">Loading receipt…</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;
  if (!receipt) return null;

  return (
    <div className="min-h-screen bg-gray-50 p-6 print:bg-white print:p-0">
      <AuditReceiptView receipt={receipt} onDownloadJson={() => downloadJson(receipt)} />
    </div>
  );
}