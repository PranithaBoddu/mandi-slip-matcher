"use client";

import { useState } from "react";
import type { RejectReason } from "@shared/types/audit.types";

const REASON_OPTIONS: { code: RejectReason["code"]; label: string }[] = [
  { code: "duplicate_token", label: "Duplicate token" },
  { code: "weight_tampering_suspected", label: "Weight tampering suspected" },
  { code: "vehicle_mismatch", label: "Vehicle registration mismatch" },
  { code: "date_mismatch", label: "Date mismatch" },
  { code: "illegible_document", label: "Illegible document" },
  { code: "farmer_id_mismatch", label: "Farmer ID mismatch" },
  { code: "other", label: "Other" },
];

interface RejectReasonDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason: RejectReason) => void;
}

export function RejectReasonDialog({ open, onClose, onConfirm }: RejectReasonDialogProps) {
  const [code, setCode] = useState<RejectReason["code"]>("weight_tampering_suspected");
  const [note, setNote] = useState("");

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
        <h3 className="text-sm font-semibold text-gray-900">Reject Payout</h3>
        <p className="mt-1 text-xs text-gray-500">Select a reason. This will be recorded in the audit log.</p>

        <div className="mt-3 space-y-1.5">
          {REASON_OPTIONS.map(opt => (
            <label key={opt.code} className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm cursor-pointer hover:bg-gray-50">
              <input type="radio" checked={code === opt.code} onChange={() => setCode(opt.code)} />
              {opt.label}
            </label>
          ))}
        </div>

        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Additional note (optional)"
          className="mt-3 w-full rounded-lg border border-gray-200 p-2 text-sm"
          rows={3}
        />

        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100">Cancel</button>
          <button
            onClick={() => onConfirm({ code, note })}
            className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700"
          >
            Confirm Reject
          </button>
        </div>
      </div>
    </div>
  );
}