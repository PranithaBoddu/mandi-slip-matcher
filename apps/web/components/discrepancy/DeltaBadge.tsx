import type { MatchStatus } from "@shared/types/reconciliation.types";

const STATUS_STYLES: Record<MatchStatus, { bg: string; text: string; label: string; dot: string }> = {
  match: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500", label: "Match" },
  warning: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500", label: "Review" },
  mismatch: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500", label: "Mismatch" },
  missing_data: { bg: "bg-gray-50", text: "text-gray-600", dot: "bg-gray-400", label: "No Data" },
};

export function DeltaBadge({ status }: { status: MatchStatus }) {
  const s = STATUS_STYLES[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full ${s.bg} ${s.text} px-2.5 py-0.5 text-xs font-medium`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}