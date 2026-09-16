"use client";

import { useCallback, useRef, useState } from "react";

interface DropzoneProps {
  label: string;
  accentColor: "amber" | "teal";
  onFileSelected: (file: File, captureMode: "camera" | "file_upload" | "scan") => void;
  isUploading: boolean;
  previewUrl?: string | null;
  uploadedFileName?: string | null;
  onRemove?: () => void;
  errorMessage?: string | null;
}

function SingleDropzone({ label, accentColor, onFileSelected, isUploading, previewUrl, uploadedFileName, onRemove, errorMessage }: DropzoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const accent = accentColor === "amber"
    ? { border: "border-amber-400", bg: "bg-amber-50", text: "text-amber-700", ring: "ring-amber-300" }
    : { border: "border-teal-400", bg: "bg-teal-50", text: "text-teal-700", ring: "ring-teal-300" };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) onFileSelected(file, "file_upload");
  }, [onFileSelected]);

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
      className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 transition-all
        ${isDragOver ? `${accent.border} ${accent.bg} ring-4 ${accent.ring}` : "border-gray-300 bg-white"}
        min-h-[280px]`}
    >
      <span className={`absolute top-3 left-4 text-xs font-semibold uppercase tracking-wide ${accent.text}`}>
        {label}
      </span>

      {previewUrl ? (
        <img src={previewUrl} alt={`${label} preview`} className="max-h-[200px] rounded-lg object-contain shadow-sm" />
      ) : uploadedFileName ? (
        <div className="flex flex-col items-center gap-2 text-center">
          <div className={`flex h-12 w-12 items-center justify-center rounded-full ${accent.bg} ${accent.text}`}>
            <span className="text-xl">✓</span>
          </div>
          <p className="text-sm font-medium text-gray-800">Document uploaded</p>
          <p className="max-w-[240px] truncate text-xs text-gray-500" title={uploadedFileName}>{uploadedFileName}</p>
          <button type="button" onClick={onRemove} className="text-xs font-medium text-red-600 hover:text-red-800">
            Remove file
          </button>
        </div>
      ) : isUploading ? (
        <div className="flex flex-col items-center gap-3">
          <div className={`h-8 w-8 animate-spin rounded-full border-4 border-gray-200 ${accent.border} border-t-transparent`} />
          <p className="text-sm text-gray-500">Extracting fields…</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 text-center">
          <svg className="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
          <p className="text-sm text-gray-600">Drag & drop, or choose an option</p>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-700"
            >
              Browse File
            </button>
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium ${accent.text} ${accent.border} hover:${accent.bg}`}
            >
              Use Camera
            </button>
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,application/pdf"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onFileSelected(f, "file_upload"); }}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onFileSelected(f, "camera"); }}
      />

      {errorMessage && (
        <p className="absolute bottom-3 left-4 right-4 text-xs text-red-600">{errorMessage}</p>
      )}
    </div>
  );
}

interface DualDropzoneProps {
  onGatePassSelected: (file: File, mode: "camera" | "file_upload" | "scan") => void;
  onWeighbridgeSelected: (file: File, mode: "camera" | "file_upload" | "scan") => void;
  isUploadingGatePass: boolean;
  isUploadingWeighbridge: boolean;
  gatePassPreviewUrl?: string | null;
  weighbridgePreviewUrl?: string | null;
  gatePassFileName?: string | null;
  weighbridgeFileName?: string | null;
  onRemoveGatePass?: () => void;
  onRemoveWeighbridgeSlip?: () => void;
  error?: string | null;
}

export function DualDropzone(props: DualDropzoneProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <SingleDropzone
        label="Gate Pass"
        accentColor="amber"
        onFileSelected={props.onGatePassSelected}
        isUploading={props.isUploadingGatePass}
        previewUrl={props.gatePassPreviewUrl}
        uploadedFileName={props.gatePassFileName}
        onRemove={props.onRemoveGatePass}
        errorMessage={props.error}
      />
      <SingleDropzone
        label="Weighbridge Slip"
        accentColor="teal"
        onFileSelected={props.onWeighbridgeSelected}
        isUploading={props.isUploadingWeighbridge}
        previewUrl={props.weighbridgePreviewUrl}
        uploadedFileName={props.weighbridgeFileName}
        onRemove={props.onRemoveWeighbridgeSlip}
        errorMessage={props.error}
      />
    </div>
  );
}