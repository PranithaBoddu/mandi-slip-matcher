import { randomUUID } from "node:crypto";
import { DocumentAsset, ExtractedField } from "@shared/types/common.types";
import { GatePass, GatePassFields } from "@shared/types/gate-pass.types";
import { DocumentParser, RawExtractionResult } from "./DocumentParser";

const GATE_PASS_SCHEMA_PROMPT = `
Extract the following fields from this Mandi gate pass image. Return strict JSON only.
Fields: tokenId, gatePassDate (ISO yyyy-mm-dd), vehicleRegNumber, farmerId, farmerName,
commodityType, mandiYardCode, entryTime (HH:mm or null), declaredBags (number or null).
For each field return { value, confidence (0-1), boundingBox: {x,y,width,height} normalized 0-1 }.
If a field is illegible or absent, set value to null and confidence to 0.
Flag image quality issues (low_light, folded_or_creased, blurred, handwritten, partial_occlusion, skewed).
`;

export class GatePassParser {
  constructor(private parser: DocumentParser) {}

  async parse(document: DocumentAsset): Promise<GatePass> {
    const raw: RawExtractionResult = await this.parser.extract(document, "gate_pass");

    const fields: GatePassFields = {
      tokenId: this.toField<string>(raw, "tokenId"),
      gatePassDate: this.toField<string>(raw, "gatePassDate"),
      vehicleRegNumber: this.toField<string>(raw, "vehicleRegNumber"),
      farmerId: this.toField<string>(raw, "farmerId"),
      farmerName: this.toField<string>(raw, "farmerName"),
      commodityType: this.toField<string>(raw, "commodityType"),
      mandiYardCode: this.toField<string>(raw, "mandiYardCode"),
      entryTime: this.toField<string | null>(raw, "entryTime"),
      declaredBags: this.toField<number | null>(raw, "declaredBags", true),
    };

    return {
      id: randomUUID(),
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
      return { value: (numeric ? null : "") as T, rawText: "", confidence: 0, source: "ocr" as const };
    }
    return {
      value: (numeric ? (f.value ? Number(f.value) : null) : f.value) as T,
      rawText: f.value,
      confidence: f.confidence,
      source: "ocr" as const,
      boundingBox: f.boundingBox,
      page: f.page,
    };
  }

  get schemaPrompt() {
    return GATE_PASS_SCHEMA_PROMPT;
  }
}