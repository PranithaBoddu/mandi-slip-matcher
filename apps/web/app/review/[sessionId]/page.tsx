"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useReconciliation } from "../../../hooks/useReconciliation";
import { SyncedScrollPane } from "../../../components/inspector/SyncedScrollPane";
import { DiscrepancyMatrix } from "../../../components/discrepancy/DiscrepancyMatrix";
import { PayoutActionBar } from "../../../components/actions/ApprovePayoutButton";
import { apiClient } from "../../../lib/api-client";
import type { RejectReason } from "@shared/types/audit.types";

export default function ReviewPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const router = useRouter();
  const { result, loading, error, runReconciliation } = useReconciliation(sessionId);
  const [activeFieldKey, setActiveFieldKey] = useState<string | null>(null);
  const [syncZoomPan, setSyncZoomPan] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => { runReconciliation(); }, [runReconciliation]);

  const submitDecision = async (decision: "approved" | "flagged_for_review" | "rejected", extra?: any) => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const { auditLog } = await apiClient.submitDecision({ sessionId, decision, ...extra });
      router.push(`/audit/${auditLog.id}`);
    } catch (err: any) {
      setSubmitError(err.message ?? "Could not save the decision");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Running reconciliation…</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;
  if (!result) return null;

  return (
    <div className="mx-auto max-w-6xl space-y-4 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="text-sm font-medium text-gray-500 hover:text-gray-900"
          >
            ← Back to uploads
          </button>
          <h1 className="text-lg font-semibold text-gray-900">Gate Pass ↔ Weighbridge Review</h1>
        </div>
        <label className="flex items-center gap-2 text-xs text-gray-500">
          <input type="checkbox" checked={syncZoomPan} onChange={(e) => setSyncZoomPan(e.target.checked)} />
          Sync zoom/pan
        </label>
      </div>

      {/* SyncedScrollPane fed with document image URLs + boxes mapped from comparisons */}
      <SyncedScrollPane
        gatePassImageUrl={`/api/documents/${result.gatePassId}/image`}
        weighbridgeImageUrl={`/api/documents/${result.weighbridgeSlipId}/image`}
        gatePassBoxes={[]}       /* mapped from gatePass.fields[*].boundingBox in full impl */
        weighbridgeBoxes={[]}    /* mapped from weighbridgeSlip.fields[*].boundingBox in full impl */
        activeFieldKey={activeFieldKey}
        onBoxHover={setActiveFieldKey}
        syncZoomPan={syncZoomPan}
      />

      <DiscrepancyMatrix result={result} activeFieldKey={activeFieldKey} onHoverField={setActiveFieldKey} />

      {submitError && (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {submitError}
        </p>
      )}

      <PayoutActionBar
        result={result}
        isSubmitting={isSubmitting}
        onApprove={() => submitDecision("approved")}
        onFlag={(note) => submitDecision("flagged_for_review", { flagNote: note })}
        onReject={(reason: RejectReason) => submitDecision("rejected", { rejectReason: reason })}
      />
    </div>
  );
}