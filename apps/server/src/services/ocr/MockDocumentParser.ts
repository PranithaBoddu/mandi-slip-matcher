import { DocumentAsset } from "@shared/types/common.types";
import { DocumentParser, RawExtractionResult } from "./DocumentParser";

/**
 * Deterministic-ish mock so the UI and reconciliation engine can be
 * developed/demoed without burning real API calls. Reads a scenario
 * hint off the filename (e.g. "duplicate", "mismatch", "clean") so
 * QA can drive specific test paths just by naming the uploaded file.
 */
export class MockDocumentParser implements DocumentParser {
  async extract(document: DocumentAsset, documentType: "gate_pass" | "weighbridge_slip"): Promise<RawExtractionResult> {
    const scenario = this.detectScenario(document.originalFilename);
    await new Promise(r => setTimeout(r, 400)); // simulate network latency

    if (documentType === "gate_pass") {
      return this.mockGatePass(scenario);
    }
    return this.mockWeighbridge(scenario);
  }

  private detectScenario(filename: string): "clean" | "mismatch" | "duplicate" | "lowconf" {
    const f = filename.toLowerCase();
    if (f.includes("duplicate")) return "duplicate";
    if (f.includes("mismatch")) return "mismatch";
    if (f.includes("lowconf") || f.includes("blurred")) return "lowconf";
    return "clean";
  }

  private field(value: any, confidence = 0.95) {
    return { value, confidence, boundingBox: { x: 0.1, y: 0.1, width: 0.3, height: 0.05 } };
  }

  private mockGatePass(scenario: string): RawExtractionResult {
    const base = {
      tokenId: this.field(scenario === "mismatch" ? "TKN-2026-004822" : "TKN-2026-004821"),
      gatePassDate: this.field("2026-09-15"),
      vehicleRegNumber: this.field("TS09EA4521"),
      farmerId: this.field("FRM-88213"),
      farmerName: this.field("Ramesh Reddy"),
      commodityType: this.field("Wheat"),
      mandiYardCode: this.field("MDY-HYD-07"),
      entryTime: this.field("08:32"),
      declaredBags: this.field("42"),
    };

    if (scenario === "mismatch") {
      base.vehicleRegNumber = this.field("TS09EA4521");
      base.gatePassDate = this.field("2026-09-14"); // date mismatch vs slip
    }
    if (scenario === "lowconf") {
      base.vehicleRegNumber = this.field("T509EA4S21", 0.42); // OCR-confused digits
    }

    return {
      fields: base,
      qualityFlags: scenario === "lowconf" ? ["blurred", "low_light"] : [],
      extractionSucceeded: true,
      errors: [],
    };
  }

  private mockWeighbridge(scenario: string): RawExtractionResult {
    const base = {
      tokenId: this.field(
        scenario === "duplicate" ? "TKN-2026-004811"
        : scenario === "mismatch" ? "TKN-2026-004822"
        : "TKN-2026-004821"
      ),
      weighDate: this.field("2026-09-15"),
      vehicleRegNumber: this.field("TS09EA4521"),
      grossWeightKg: this.field("8420"),
      tareWeightKg: this.field("3210"),
      netWeightKg: this.field("5210"),
      commodityType: this.field("Wheat"),
      weighbridgeOperatorId: this.field("OP-114"),
      weighTime: this.field("08:47"),
    };

    if (scenario === "mismatch") {
      base.netWeightKg = this.field("5480"); // beyond tolerance vs declared/consistency
    }
    if (scenario === "lowconf") {
      base.vehicleRegNumber = this.field("TS09EA45Z1", 0.5);
    }

    return {
      fields: base,
      qualityFlags: scenario === "lowconf" ? ["handwritten"] : [],
      extractionSucceeded: true,
      errors: [],
    };
  }
}