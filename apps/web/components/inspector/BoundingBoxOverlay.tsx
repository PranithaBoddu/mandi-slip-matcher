"use client";

import type { BoundingBox } from "@shared/types/common.types";

interface HighlightBox extends BoundingBox {
  fieldKey: string;
  status: "match" | "mismatch" | "warning" | "missing_data";
  label: string;
}

interface BoundingBoxOverlayProps {
  boxes: HighlightBox[];
  activeFieldKey: string | null;
  onBoxHover?: (fieldKey: string | null) => void;
}

const STATUS_COLORS: Record<HighlightBox["status"], string> = {
  match: "border-emerald-500 bg-emerald-500/10",
  mismatch: "border-red-500 bg-red-500/15",
  warning: "border-amber-500 bg-amber-500/15",
  missing_data: "border-gray-400 bg-gray-400/10",
};

export function BoundingBoxOverlay({ boxes, activeFieldKey, onBoxHover }: BoundingBoxOverlayProps) {
  return (
    <div className="pointer-events-none absolute inset-0">
      {boxes.map((box) => {
        const isActive = activeFieldKey === box.fieldKey;
        return (
          <div
            key={box.fieldKey}
            onMouseEnter={() => onBoxHover?.(box.fieldKey)}
            onMouseLeave={() => onBoxHover?.(null)}
            className={`pointer-events-auto absolute rounded-sm border-2 transition-all cursor-pointer
              ${STATUS_COLORS[box.status]}
              ${isActive ? "ring-2 ring-offset-1 ring-blue-500 z-10 scale-[1.03]" : ""}`}
            style={{
              left: `${box.x * 100}%`,
              top: `${box.y * 100}%`,
              width: `${box.width * 100}%`,
              height: `${box.height * 100}%`,
            }}
            title={box.label}
          >
            {isActive && (
              <span className="absolute -top-6 left-0 whitespace-nowrap rounded bg-gray-900 px-1.5 py-0.5 text-[10px] font-medium text-white">
                {box.label}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}