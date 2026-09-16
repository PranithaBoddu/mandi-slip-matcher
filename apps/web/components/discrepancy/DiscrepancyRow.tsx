"use client";

import type { FieldComparison } from "@shared/types/reconciliation.types";
import { DeltaBadge } from "./DeltaBadge";

interface DiscrepancyRowProps {
  comparison: FieldComparison;
  isActive: boolean;
  onHover: (fieldKey: string | null) => void;
}

export function DiscrepancyRow({ comparison, isActive, onHover }: DiscrepancyRowProps) {
  const c = comparison;
  return (
    <tr
      onMouseEnter={() => onHover(c.key)}
      onMouseLeave={() => onHover(null)}
      className={`border-b border-gray-100 text-sm transition-colors ${isActive ? "bg-blue-50" : "hover:bg-gray-50"}`}
    >
      <td className="py-2.5 pl-4 pr-2 font-medium text-gray-800">
        {c.label}
        {c.requiresManualReview && (
          <span className="ml-1.5 text-amber-500" title="Requires manual review">●</span>
        )}
      </td>
      <td className="px-2 py-2.5 text-gray-600">{c.gatePassValue ?? "—"}</td>
      <td className="px-2 py-2.5 text-gray-600">{c.weighbridgeValue ?? "—"}</td>
      <td className="px-2 py-2.5 text-gray-500">
        {c.deltaAbsolute != null
          ? `${c.deltaAbsolute.toFixed(1)} (${c.deltaPercent?.toFixed(2)}%)`
          : c.fuzzyMatchScore != null
          ? `${(c.fuzzyMatchScore * 100).toFixed(0)}% sim.`
          : "—"}
      </td>
      <td className="px-2 py-2.5"><DeltaBadge status={c.status} /></td>
      <td className="py-2.5 pr-4 pl-2 text-xs text-gray-400 max-w-[180px] truncate" title={c.notes}>
        {c.notes ?? ""}
      </td>
    </tr>
  );
}