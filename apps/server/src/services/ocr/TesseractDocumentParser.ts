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
    return {
      tokenId: this.field(this.findTokenId(text)),
      gatePassDate: this.field(this.findDate(text)),
      vehicleRegNumber: this.field(this.findVehicle(text)),
      farmerId: this.field(this.findFarmerId(text)),
      farmerName: this.field(this.findFarmerName(text)),
      commodityType: this.field(this.findCommodity(text)),
      mandiYardCode: this.field(this.findMandiCode(text)),
      entryTime: this.field(this.findTime(text, "entry")),
      declaredBags: this.field(this.findBags(text)),
    };
  }

  private parseWeighbridge(text: string): Record<string, RawExtractionField> {
    return {
      tokenId: this.field(this.findTokenId(text)),
      weighDate: this.field(this.findDate(text)),
      vehicleRegNumber: this.field(this.findVehicle(text)),
      grossWeightKg: this.field(this.findWeight(text, "gross")),
      tareWeightKg: this.field(this.findWeight(text, "tare")),
      netWeightKg: this.field(this.findWeight(text, "net")),
      commodityType: this.field(this.findCommodity(text)),
      weighbridgeOperatorId: this.field(this.findOperatorId(text)),
      weighTime: this.field(this.findTime(text, "weigh")),
    };
  }

  private field(value: string): RawExtractionField {
    return { value, confidence: value ? 0.75 : 0 };
  }

  private findValue(text: string, label: string): string {
    const lines = text.split(/\r?\n/);

    for (const line of lines) {
      if (line.toLowerCase().includes(label.toLowerCase())) {
        const parts = line.split(":");
        if (parts.length > 1) {
          return parts.slice(1).join(":").trim();
        }
      }
    }

    return "";
  }

  private findTokenId(text: string): string {
    // First look for a labeled token number
    const value = this.findValue(text, "Token No");
    const cleaned = this.cleanToken(value);
    if (cleaned) return cleaned;

    // Fallback: search anywhere in the OCR text
    const match = text.match(/\bTKN-\d{4}-\d+\b/i);
    return match?.[0].toUpperCase() ?? "";
  }

  private cleanToken(value: string): string {
    const m = value.match(/TKN-\d{4}-\d+/i);
    return m?.[0].toUpperCase() ?? "";
  }
  private findDate(text: string): string {
  const m = text.match(/\b\d{4}-\d{2}-\d{2}\b/);
  return m?.[0] ?? "";
  }

  private findVehicle(text: string): string {
    const value = this.findValue(text, "Vehicle Registration")
              || this.findValue(text, "Vehicle Reg. No");

    const m = value.match(/TS\d{2}[A-Z]{2}\d{4}/i);
    return m?.[0].toUpperCase() ?? "";
  }

  private findFarmerId(text: string): string {
    const m = text.match(/\bFRM-\d+\b/i);
    return m?.[0].toUpperCase() ?? "";
  }

  private findFarmerName(text: string): string {
    const m = text.match(/Farmer\s*Name\s*[:\-]?\s*([A-Za-z ]+)/i);
    return m?.[1]?.trim() ?? "";
  }

  private findCommodity(text: string): string {
    return this.findValue(text, "Commodity Type")
        || this.findValue(text, "Commodity");
  }

  private findMandiCode(text: string): string {
    const m = text.match(/\bMDY-[A-Z]{3}-\d+\b/i);
    return m?.[0].toUpperCase() ?? "";
  }

  private findBags(text: string): string {
    const m = text.match(/Declared\s*Bags\s*[:\-]?\s*(\d+)/i);
    return m?.[1] ?? "";
  }

  private findWeight(text: string, type: "gross" | "tare" | "net"): string {
    const label =
      type === "gross"
        ? "Gross Weight"
        : type === "tare"
        ? "Tare Weight"
        : "Net Weight";

    const value = this.findValue(text, label);
    return value.replace(/[^\d]/g, "");
  }

  private findOperatorId(text: string): string {
    const m = text.match(/Operator\s*ID\s*[:\-]?\s*([A-Z0-9-]+)/i);
    return m?.[1] ?? "";
  }

  private findTime(text: string, mode: "entry" | "weigh"): string {
    const regex =
      mode === "entry"
        ? /Entry\s*Time\s*[:\-]?\s*(\d{2}:\d{2})/i
        : /Weigh\s*Time\s*[:\-]?\s*(\d{2}:\d{2})/i;

    return text.match(regex)?.[1] ?? "";
  }
  private detectQualityFlags(text: string): string[] {
    const flags: string[] = [];
    if (text.trim().length < 40) flags.push("partial_occlusion");
    return flags;
  }
}
