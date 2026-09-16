"use client";

import { useRef, useState, useCallback, WheelEvent, MouseEvent } from "react";
import { BoundingBoxOverlay } from "./BoundingBoxOverlay";

interface DocumentViewerProps {
  imageUrl: string;
  boxes: Array<{ fieldKey: string; x: number; y: number; width: number; height: number; status: any; label: string }>;
  activeFieldKey: string | null;
  onBoxHover?: (fieldKey: string | null) => void;
  zoom: number;
  pan: { x: number; y: number };
  onZoomChange: (zoom: number) => void;
  onPanChange: (pan: { x: number; y: number }) => void;
}

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;

export function DocumentViewer({
  imageUrl, boxes, activeFieldKey, onBoxHover,
  zoom, pan, onZoomChange, onPanChange,
}: DocumentViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.15 : 0.15;
    onZoomChange(Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom + delta)));
  }, [zoom, onZoomChange]);

  const handleMouseDown = useCallback((e: MouseEvent) => {
    if (zoom <= 1) return;
    isDragging.current = true;
    lastPos.current = { x: e.clientX, y: e.clientY };
  }, [zoom]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging.current) return;
    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;
    lastPos.current = { x: e.clientX, y: e.clientY };
    onPanChange({ x: pan.x + dx, y: pan.y + dy });
  }, [pan, onPanChange]);

  const stopDragging = useCallback(() => { isDragging.current = false; }, []);

  return (
    <div className="flex flex-col rounded-xl border border-gray-200 bg-gray-50 overflow-hidden">
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-3 py-2">
        <div className="flex gap-1">
          <button onClick={() => onZoomChange(Math.max(MIN_ZOOM, zoom - 0.25))} className="rounded p-1 hover:bg-gray-100" aria-label="Zoom out">−</button>
          <span className="w-12 text-center text-xs text-gray-500 self-center">{Math.round(zoom * 100)}%</span>
          <button onClick={() => onZoomChange(Math.min(MAX_ZOOM, zoom + 0.25))} className="rounded p-1 hover:bg-gray-100" aria-label="Zoom in">+</button>
        </div>
        <button
          onClick={() => { onZoomChange(1); onPanChange({ x: 0, y: 0 }); }}
          className="text-xs text-gray-500 hover:text-gray-800"
        >
          Reset view
        </button>
      </div>

      <div
        ref={containerRef}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={stopDragging}
        onMouseLeave={stopDragging}
        className={`relative h-[480px] overflow-hidden ${zoom > 1 ? "cursor-grab active:cursor-grabbing" : "cursor-default"}`}
      >
        <div
          className="relative h-full w-full origin-center transition-transform duration-75"
          style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
        >
          <img src={imageUrl} alt="Document" className="h-full w-full object-contain select-none" draggable={false} />
          <BoundingBoxOverlay boxes={boxes} activeFieldKey={activeFieldKey} onBoxHover={onBoxHover} />
        </div>
      </div>
    </div>
  );
}