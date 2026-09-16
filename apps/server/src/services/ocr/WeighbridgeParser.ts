import { DocumentAsset, ExtractedField } from "@shared/types/common.types";
import { WeighbridgeSlip, WeighbridgeFields } from "@shared/types/weighbridge.types";
import { DocumentParser, RawExtractionResult } from "./DocumentParser";

const WEIGHBRIDGE_SCHEMA_PROMPT = `
Extract the following fields from this weighbridge slip image. Return strict JSON only.
Fields: tokenId, weighDate (ISO yyyy-mm-dd), vehicleRegNumber, grossWeightKg (number),
tareWeightKg (number), netWeightKg (number), commodityType, weighbridgeOperatorId (or null),
weighTime (HH:mm or null).
For each field return { value, confidence (0-1), boundingBox: {x,y,width,height} normalized 0-1 }.
If a field is illegible or absent, set value to null and confidence to 0.
Flag image quality issues (low_light, folded_or_creased, blurred, handwritten, partial_occlusion, skewed).
`;

export class WeighbridgeParser {
  constructor(private parser: DocumentParser) {}

  async parse(document: DocumentAsset): Promise<WeighbridgeSlip> {
    const raw: RawExtractionResult = await this.parser.extract(document, "weighbridge_slip");

    const fields: WeighbridgeFields = {
      tokenId: this.toField<string>(raw, "tokenId"),
      weighDate: this.toField<string>(raw, "weighDate"),
      vehicleRegNumber: this.toField<string>(raw, "vehicleRegNumber"),
      grossWeightKg: this.toField<number>(raw, "grossWeightKg", true),
      tareWeightKg: this.toField<number>(raw, "tareWeightKg", true),
      netWeightKg: this.toField<number>(raw, "netWeightKg", true),
      commodityType: this.toField<string>(raw, "commodityType"),
      weighbridgeOperatorId: this.toField<string | null>(raw, "weighbridgeOperatorId"),
      weighTime: this.toField<string | null>(raw, "weighTime"),
    };

    return {
      id: crypto.randomUUID(),
      document: { ...document, imageQualityFlags: raw.qualityFlags as any },
      status: raw.extractionSucceeded ? "extracted" : "extraction_failed",
      fields,
      extractionErrors: raw.errors,
      createdAt: new Date().toISOString(),
    };
  }

  private toField<T>(raw: RawExtractionResult, key: string, numeric = false): ExtractedField<T> {
    const f = raw.fields[key];
    if (!f) {
      return { value: (numeric ? 0 : "") as T, rawText: "", confidence: 0, source: "ocr" as const };
    }
    return {
      value: (numeric ? Number(f.value) : f.value) as T,
      rawText: f.value,
      confidence: f.confidence,
      source: "ocr" as const,
      boundingBox: f.boundingBox,
      page: f.page,
    };
  }

  get schemaPrompt() {
    return WEIGHBRIDGE_SCHEMA_PROMPT;
  }
}