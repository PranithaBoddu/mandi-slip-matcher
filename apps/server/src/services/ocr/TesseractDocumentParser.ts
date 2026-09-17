import fs from "fs/promises";
import { createWorker } from "tesseract.js";
import { DocumentAsset } from "@shared/types/common.types";
import { DocumentParser, RawExtractionField, RawExtractionResult } from "./DocumentParser";

const FIELD_LABELS = {
  tokenId: "(?:token\\s*(?:id|no\\.?|number)?|token)",
  gatePassDate: "(?:gate\\s*pass\\s*date|pass\\s*date|date)",
  weighDate: "(?:weigh(?:bridge)?\\s*date|weigh\\s*date|date)",
  vehicleRegNumber: "(?:vehicle\\s*(?:registration|reg(?:istration)?\\s*no\\.?|number)|vehicle\\s*no\\.?)",
  farmerId: "(?:farmer\\s*(?:id|no\\.?|number))",
  farmerName: "(?:farmer\\s*name|name)",
  commodityType: "(?:commodity|commodity\\s*type|crop)",
  mandiYardCode: "(?:mandi\\s*(?:yard\\s*)?code|yard\\s*code)",
  entryTime: "(?:entry\\s*time)",
  declaredBags: "(?:declared\\s*bags|bags)",
  grossWeightKg: "(?:gross\\s*weight|gross)",
  tareWeightKg: "(?:tare\\s*weight|tare)",
  netWeightKg: "(?:net\\s*weight|net)",
  weighbridgeOperatorId: "(?:weighbridge\\s*(?:operator\\s*)?id|operator\\s*id|operator)",
  weighTime: "(?:weigh(?:bridge)?\\s*time|weigh\\s*time|time)",
} as const;

type DocumentType = "gate_pass" | "weighbridge_slip";

export class TesseractDocumentParser implements DocumentParser {
  async extract(document: DocumentAsset, documentType: DocumentType): Promise<RawExtractionResult> {
    if (document.mimeType === "application/pdf") {
      return {
        fields: {},
        qualityFlags: [],
        extractionSucceeded: false,
        errors: ["Local Tesseract OCR currently supports image files only. Upload a JPG, PNG, or WEBP scan."],
      };
    }

    let worker: Awaited<ReturnType<typeof createWorker>> | undefined;
    try {
      worker = await createWorker("eng");
      const result = await worker.recognize(await fs.readFile(document.storageUrl));
      const text = result.data.text;
      const fields = documentType === "gate_pass"
        ? this.parseGatePass(text)
        : this.parseWeighbridge(text);

      return {
        fields,
        qualityFlags: this.detectQualityFlags(text),
        extractionSucceeded: text.trim().length > 0,
        errors: text.trim().length > 0 ? [] : ["No readable text was found in the image."],
      };
    } catch (error: any) {
      return {
        fields: {},
        qualityFlags: [],
        extractionSucceeded: false,
        errors: [`Tesseract OCR failed: ${error.message ?? "unknown error"}`],
      };
    } finally {
      await worker?.terminate();
    }
  }

  private parseGatePass(text: string): Record<string, RawExtractionField> {
    const tokenId = this.findTokenId(text) || this.findValue(text, FIELD_LABELS.tokenId);
    return {
      tokenId: this.field(tokenId),
      gatePassDate: this.field(this.findValue(text, FIELD_LABELS.gatePassDate)),
      vehicleRegNumber: this.field(this.findValue(text, FIELD_LABELS.vehicleRegNumber)),
      farmerId: this.field(this.findValue(text, FIELD_LABELS.farmerId)),
      farmerName: this.field(this.findValue(text, FIELD_LABELS.farmerName)),
      commodityType: this.field(this.findValue(text, FIELD_LABELS.commodityType)),
      mandiYardCode: this.field(this.findValue(text, FIELD_LABELS.mandiYardCode)),
      entryTime: this.field(this.findValue(text, FIELD_LABELS.entryTime)),
      declaredBags: this.field(this.findValue(text, FIELD_LABELS.declaredBags)),
    };
  }

  private parseWeighbridge(text: string): Record<string, RawExtractionField> {
    const tokenId = this.findTokenId(text) || this.findValue(text, FIELD_LABELS.tokenId);
    return {
      tokenId: this.field(tokenId),
      weighDate: this.field(this.findValue(text, FIELD_LABELS.weighDate)),
      vehicleRegNumber: this.field(this.findValue(text, FIELD_LABELS.vehicleRegNumber)),
      grossWeightKg: this.field(this.findValue(text, FIELD_LABELS.grossWeightKg)),
      tareWeightKg: this.field(this.findValue(text, FIELD_LABELS.tareWeightKg)),
      netWeightKg: this.field(this.findValue(text, FIELD_LABELS.netWeightKg)),
      commodityType: this.field(this.findValue(text, FIELD_LABELS.commodityType)),
      weighbridgeOperatorId: this.field(this.findValue(text, FIELD_LABELS.weighbridgeOperatorId)),
      weighTime: this.field(this.findValue(text, FIELD_LABELS.weighTime)),
    };
  }

  private field(value: string): RawExtractionField {
    return { value, confidence: value ? 0.75 : 0 };
  }

  private findValue(text: string, labelPattern: string): string {
    const match = text.match(new RegExp(`${labelPattern}\\s*[:#-]?\\s*([^\\n|]+)`, "im"));
    return match?.[1]?.replace(/[|]/g, "").trim() ?? "";
  }

  private findTokenId(text: string): string {
    const labeled = text.match(/(?:token|tok)\s*(?:id|no\.?|number)?\s*[:#-]?\s*([A-Z0-9][A-Z0-9\s./_-]{3,})/i);
    const labeledValue = this.cleanToken(labeled?.[1] ?? "");
    if (labeledValue) return labeledValue;

    const match = text.match(/\b(?:TKN|TK|TOKEN)?\s*\d{3,6}\s*(?:[-/\s]\s*\d{2,6}){1,3}\b/i);
    return this.cleanToken(match?.[0] ?? "");
  }

  private cleanToken(value: string): string {
    return value
      .replace(/[|,;:.]+$/, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  private detectQualityFlags(text: string): string[] {
    const flags: string[] = [];
    if (text.trim().length < 40) flags.push("partial_occlusion");
    return flags;
  }
}
