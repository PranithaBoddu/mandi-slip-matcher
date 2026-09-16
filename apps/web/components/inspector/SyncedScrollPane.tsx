"use client";

import { useState } from "react";
import { DocumentViewer } from "./DocumentViewer";

interface SyncedScrollPaneProps {
  gatePassImageUrl: string;
  weighbridgeImageUrl: string;
  gatePassBoxes: any[];
  weighbridgeBoxes: any[];
  activeFieldKey: string | null;
  onBoxHover: (fieldKey: string | null) => void;
  syncZoomPan: boolean;
}

/**
 * Keeps both viewers at the same zoom/pan level when syncZoomPan is true,
 * so an agent panning to inspect the token ID on one slip sees the
 * corresponding region on the other slip automatically. Independent
 * mode lets each viewer be driven separately for closer comparison.
 */
export function SyncedScrollPane({
  gatePassImageUrl, weighbridgeImageUrl,
  gatePassBoxes, weighbridgeBoxes,
  activeFieldKey, onBoxHover, syncZoomPan,
}: SyncedScrollPaneProps) {
  const [sharedZoom, setSharedZoom] = useState(1);
  const [sharedPan, setSharedPan] = useState({ x: 0, y: 0 });
  const [gpZoom, setGpZoom] = useState(1);
  const [gpPan, setGpPan] = useState({ x: 0, y: 0 });
  const [wbZoom, setWbZoom] = useState(1);
  const [wbPan, setWbPan] = useState({ x: 0, y: 0 });

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <DocumentViewer
        imageUrl={gatePassImageUrl}
        boxes={gatePassBoxes}
        activeFieldKey={activeFieldKey}
        onBoxHover={onBoxHover}
        zoom={syncZoomPan ? sharedZoom : gpZoom}
        pan={syncZoomPan ? sharedPan : gpPan}
        onZoomChange={syncZoomPan ? setSharedZoom : setGpZoom}
        onPanChange={syncZoomPan ? setSharedPan : setGpPan}
      />
      <DocumentViewer
        imageUrl={weighbridgeImageUrl}
        boxes={weighbridgeBoxes}
        activeFieldKey={activeFieldKey}
        onBoxHover={onBoxHover}
        zoom={syncZoomPan ? sharedZoom : wbZoom}
        pan={syncZoomPan ? sharedPan : wbPan}
        onZoomChange={syncZoomPan ? setSharedZoom : setWbZoom}
        onPanChange={syncZoomPan ? setSharedPan : setWbPan}
      />
    </div>
  );
}