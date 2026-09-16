"use client";

import { useState } from "react";
import type { ReconciliationResult } from "@shared/types/reconciliation.types";
import type { RejectReason } from "@shared/types/audit.types";
import { RejectReasonDialog } from "./RejectReasonDialog";

interface ActionBarProps {
  result: ReconciliationResult;
  onApprove: () => void;
  onFlag: (note: string) => void;
  onReject: (reason: RejectReason) => void;
  isSubmitting: boolean;
}

export function PayoutActionBar({ result, onApprove, onFlag, onReject, isSubmitting }: ActionBarProps) {
  const [rejectOpen, setRejectOpen] = useState(false);
  const [flagNote, setFlagNote] = useState("");
  const [showFlagInput, setShowFlagInput] = useState(false);

  const canApprove = result.verdict === "clean_match" || result.verdict === "minor_discrepancy";
  const approveBlockedReason =
    result.verdict === "critical_mismatch" ? "Critical mismatch detected"
    : result.verdict === "duplicate_token" ? "Duplicate token"
    : result.verdict === "incomplete_data" ? "Extraction incomplete"
    : null;

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4">
      {showFlagInput && (
        <div className="flex gap-2">
          <input
            value={flagNote}
            onChange={(e) => setFlagNote(e.target.value)}
            placeholder="Reason for flagging (visible to supervisor)"
            className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm"
          />
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <button
          disabled={!canApprove || isSubmitting}
          onClick={onApprove}
          title={approveBlockedReason ?? ""}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          Approve Payout
        </button>

        <button
          disabled={isSubmitting}
          onClick={() => showFlagInput ? onFlag(flagNote) : setShowFlagInput(true)}
          className="rounded-lg border border-amber-400 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-700 hover:bg-amber-100"
        >
          {showFlagInput ? "Confirm Flag" : "Flag for Manual Review"}
        </button>

        <button
          disabled={isSubmitting}
          onClick={() => setRejectOpen(true)}
          className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
        >
          Reject with Reason
        </button>

        {approveBlockedReason && (
          <span className="ml-auto text-xs font-medium text-red-500">
            Approval blocked: {approveBlockedReason}
          </span>
        )}
      </div>

      <RejectReasonDialog
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
        onConfirm={(reason) => { setRejectOpen(false); onReject(reason); }}
      />
    </div>
  );
}