export type UUID = string;
export type ISODateString = string; // e.g. "2026-09-15"

export type FieldSource = "ocr" | "manual_override" | "system_default";
export type ConfidenceScore = number; // 0.0 - 1.0

/**
 * Every extracted field carries its own confidence + provenance +
 * bounding box, so the UI can render highlight overlays and agents
 * can judge OCR trustworthiness per-field, not just per-document.
 */
export interface ExtractedField<T> {
  value: T;
  rawText: string;              // original OCR string before normalization
  confidence: ConfidenceScore;
  source: FieldSource;
  boundingBox?: BoundingBox;    // for overlay highlighting
  page?: number;                 // for multi-page PDF scans
}

export interface BoundingBox {
  x: number;      // normalized 0-1, relative to page width
  y: number;      // normalized 0-1, relative to page height
  width: number;
  height: number;
}

export interface DocumentAsset {
  id: UUID;
  originalFilename: string;
  mimeType: "image/jpeg" | "image/png" | "image/webp" | "application/pdf";
  storageUrl: string;
  uploadedAt: string; // ISO timestamp
  pageCount: number;
  captureMode: "camera" | "file_upload" | "scan";
  imageQualityFlags: ImageQualityFlag[];
}

export type ImageQualityFlag =
  | "low_light"
  | "folded_or_creased"
  | "blurred"
  | "handwritten"
  | "partial_occlusion"
  | "skewed";

export type DocumentProcessingStatus =
  | "pending"
  | "extracting"
  | "extracted"
  | "extraction_failed"
  | "needs_manual_entry";