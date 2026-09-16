import { DocumentAsset } from "@shared/types/common.types";

/**
 * Abstraction over the multimodal OCR/vision backend so the concrete
 * provider (Claude vision API, Textract, in-house model, etc.) can be
 * swapped without touching route or engine code.
 */
export interface RawExtractionField {
  value: string;
  confidence: number;
  boundingBox?: { x: number; y: number; width: number; height: number };
  page?: number;
}

export interface RawExtractionResult {
  fields: Record<string, RawExtractionField>;
  qualityFlags: string[];        // low_light, folded_or_creased, blurred, handwritten, etc.
  extractionSucceeded: boolean;
  errors: string[];
}

export interface DocumentParser {
  /**
   * Sends the document image/PDF to the multimodal model with a
   * schema-constrained prompt and returns normalized key-value fields
   * with per-field confidence + bounding boxes for overlay rendering.
   */
  extract(document: DocumentAsset, documentType: "gate_pass" | "weighbridge_slip"): Promise<RawExtractionResult>;
}