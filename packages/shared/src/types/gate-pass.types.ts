import { ExtractedField, DocumentAsset, DocumentProcessingStatus, UUID } from "./common.types";

export interface GatePassFields {
  tokenId: ExtractedField<string>;
  gatePassDate: ExtractedField<string>;      // ISO date
  vehicleRegNumber: ExtractedField<string>;
  farmerId: ExtractedField<string>;
  farmerName: ExtractedField<string>;
  commodityType: ExtractedField<string>;
  mandiYardCode: ExtractedField<string>;
  entryTime: ExtractedField<string | null>;
  declaredBags?: ExtractedField<number | null>;
}

export interface GatePass {
  id: UUID;
  document: DocumentAsset;
  status: DocumentProcessingStatus;
  fields: GatePassFields;
  extractionErrors: string[];
  createdAt: string;
}