import { ExtractedField, DocumentAsset, DocumentProcessingStatus, UUID } from "./common.types";

export interface WeighbridgeFields {
  tokenId: ExtractedField<string>;            // must cross-match GatePass.tokenId
  weighDate: ExtractedField<string>;
  vehicleRegNumber: ExtractedField<string>;
  grossWeightKg: ExtractedField<number>;
  tareWeightKg: ExtractedField<number>;
  netWeightKg: ExtractedField<number>;        // gross - tare, but OCR'd independently for cross-check
  commodityType: ExtractedField<string>;
  weighbridgeOperatorId: ExtractedField<string | null>;
  weighTime: ExtractedField<string | null>;
}

export interface WeighbridgeSlip {
  id: UUID;
  document: DocumentAsset;
  status: DocumentProcessingStatus;
  fields: WeighbridgeFields;
  extractionErrors: string[];
  createdAt: string;
}