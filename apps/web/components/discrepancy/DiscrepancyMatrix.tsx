"use client";

import type { ReconciliationResult } from "@shared/types/reconciliation.types";
import { DiscrepancyRow } from "./DiscrepancyRow";

interface DiscrepancyMatrixProps {
  result: ReconciliationResult;
  activeFieldKey: string | null;
  onHoverField: (fieldKey: string | null) => void;
}

const VERDICT_BANNER: Record<ReconciliationResult["verdict"], { bg: string; text: string; message: string }> = {
  clean_match: { bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-800", message: "All fields matched within tolerance." },
  minor_discrepancy: { bg: "bg-amber-50 border-amber-200", text: "text-amber-800", message: "Minor discrepancies found — review before approving." },
  critical_mismatch: { bg: "bg-red-50 border-red-200", text: "text-red-800", message: "Critical mismatch — auto-approval blocked." },
  duplicate_token: { bg: "bg-red-50 border-red-200", text: "text-red-800", message: "Duplicate token — this token has already been paid out." },
  incomplete_data: { bg: "bg-gray-50 border-gray-200", text: "text-gray-700", message: "One or both documents failed extraction." },
};

export function DiscrepancyMatrix({ result, activeFieldKey, onHoverField }: DiscrepancyMatrixProps) {
  const banner = VERDICT_BANNER[result.verdict];

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <div className={`border-b px-4 py-3 ${banner.bg}`}>
        <p className={`text-sm font-semibold ${banner.text}`}>{banner.message}</p>
        <p className="mt-0.5 text-xs text-gray-500">
          Overall extraction confidence: {(result.overallConfidence * 100).toFixed(0)}%
        </p>
      </div>

      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
            <th className="py-2 pl-4 pr-2">Field</th>
            <th className="px-2 py-2">Gate Pass</th>
            <th className="px-2 py-2">Weighbridge</th>
            <th className="px-2 py-2">Delta</th>
            <th className="px-2 py-2">Status</th>
            <th className="py-2 pr-4 pl-2">Notes</th>
          </tr>
        </thead>
        <tbody>
          {result.comparisons.map((c) => (
            <DiscrepancyRow key={c.key} comparison={c} isActive={activeFieldKey === c.key} onHover={onHoverField} />
          ))}
        </tbody>
      </table>
    </div>
  );
}