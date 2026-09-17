"use client";

import type { AuditReceipt, PayoutDecision } from "@shared/types/audit.types";

interface AuditReceiptViewProps {
  receipt: AuditReceipt;
  onDownloadJson: () => void;
}

const DECISION_STYLES: Record<PayoutDecision, { label: string; bg: string; text: string }> = {
  approved: { label: "APPROVED", bg: "bg-emerald-50 border-emerald-300", text: "text-emerald-700" },
  flagged_for_review: { label: "FLAGGED FOR REVIEW", bg: "bg-amber-50 border-amber-300", text: "text-amber-700" },
  rejected: { label: "REJECTED", bg: "bg-red-50 border-red-300", text: "text-red-700" },
};

export function AuditReceiptView({ receipt, onDownloadJson }: AuditReceiptViewProps) {
  const style = DECISION_STYLES[receipt.decision];

  return (
    <div className="mx-auto max-w-2xl">
      {/* Screen-only toolbar — hidden on print via .print:hidden */}
      <div className="mb-4 flex justify-end gap-2 print:hidden">
        <button
          onClick={onDownloadJson}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Download JSON
        </button>
        <button
          onClick={() => window.print()}
          className="rounded-lg bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-700"
        >
          Print Receipt
        </button>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm print:border-0 print:shadow-none">
        <div className="flex items-start justify-between border-b border-gray-100 pb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Payout Audit Receipt</h2>
            <p className="text-xs text-gray-500">Mandi Gate Pass &amp; Weighbridge Slip Matcher</p>
          </div>
          <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${style.bg} ${style.text}`}>
            {style.label}
          </span>
        </div>

        <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
          <div>
            <dt className="text-xs uppercase tracking-wide text-gray-400">Token ID</dt>
            <dd className="font-medium text-gray-900">{receipt.tokenId}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-gray-400">Vehicle Registration</dt>
            <dd className="font-medium text-gray-900">{receipt.vehicleRegNumber || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-gray-400">Net Weight</dt>
            <dd className="font-medium text-gray-900">
              {receipt.netWeightKg == null ? "—" : `${receipt.netWeightKg.toLocaleString()} kg`}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-gray-400">Farmer Name</dt>
            <dd className="font-medium text-gray-900">{receipt.farmerName || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-gray-400">Decided By</dt>
            <dd className="font-medium text-gray-900">{receipt.agentName}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-gray-400">Decided At</dt>
            <dd className="font-medium text-gray-900">{new Date(receipt.decidedAt).toLocaleString()}</dd>
          </div>
        </dl>

        <div className="mt-6">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Discrepancy Summary</h3>
          {receipt.discrepancySummary.length === 0 ? (
            <p className="mt-2 text-sm text-emerald-600">No discrepancies — all fields matched within tolerance.</p>
          ) : (
            <ul className="mt-2 space-y-1.5">
              {receipt.discrepancySummary.map((line, i) => (
                <li key={i} className="flex gap-2 text-sm text-gray-700">
                  <span className="text-amber-500">⚠</span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          )}
          {receipt.decisionReason && (
            <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              Rejection reason: {receipt.decisionReason}
            </p>
          )}
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          {receipt.documentThumbnails.gatePassUrl && (
            <img src={receipt.documentThumbnails.gatePassUrl} alt="Gate Pass" className="rounded-lg border border-gray-200 object-contain" />
          )}
          {receipt.documentThumbnails.weighbridgeSlipUrl && (
            <img src={receipt.documentThumbnails.weighbridgeSlipUrl} alt="Weighbridge Slip" className="rounded-lg border border-gray-200 object-contain" />
          )}
        </div>

        <p className="mt-6 border-t border-gray-100 pt-3 text-[10px] text-gray-400">
          Receipt ID: {receipt.auditLogId} · Generated {new Date().toLocaleString()} · This document is
          system-generated and reflects the reconciliation state at time of decision.
        </p>
      </div>
    </div>
  );
}