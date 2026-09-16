import Anthropic from "@anthropic-ai/sdk";
import { DocumentAsset } from "@shared/types/common.types";
import { DocumentParser, RawExtractionResult } from "./DocumentParser";
import { readFileAsBase64, mimeTypeOf } from "../../utils/fileUtils";

const anthropic = new Anthropic(); // reads ANTHROPIC_API_KEY from env

const GATE_PASS_FIELDS = [
  "tokenId", "gatePassDate", "vehicleRegNumber", "farmerId", "farmerName",
  "commodityType", "mandiYardCode", "entryTime", "declaredBags",
];
const WEIGHBRIDGE_FIELDS = [
  "tokenId", "weighDate", "vehicleRegNumber", "grossWeightKg",
  "tareWeightKg", "netWeightKg", "commodityType", "weighbridgeOperatorId", "weighTime",
];

/**
 * Real implementation backing the DocumentParser interface. Swappable
 * with a mock (see MockDocumentParser) for local dev / tests without
 * burning API calls.
 */
export class ClaudeVisionDocumentParser implements DocumentParser {
  async extract(
    document: DocumentAsset,
    documentType: "gate_pass" | "weighbridge_slip"
  ): Promise<RawExtractionResult> {
    const fieldList = documentType === "gate_pass" ? GATE_PASS_FIELDS : WEIGHBRIDGE_FIELDS;
    const base64 = await readFileAsBase64(document.storageUrl);
    const mediaType = mimeTypeOf(document.mimeType);

    const systemPrompt = `You are an expert OCR system specialized in reading handwritten and
printed Indian Mandi (agricultural market) documents, including gate passes and weighbridge
slips. These are frequently low-light photos, folded, creased, or handwritten in a mix of
English and regional-script numerals. Extract fields precisely. Never guess a value you cannot
actually see — set confidence low or value null instead. Return ONLY valid JSON, no prose.`;

    const userPrompt = `Extract these fields: ${fieldList.join(", ")}.
Return JSON exactly in this shape:
{
  "fields": {
    "<fieldName>": { "value": "<string or number or null>", "confidence": <0-1>,
                      "boundingBox": {"x":0-1,"y":0-1,"width":0-1,"height":0-1} }
  },
  "qualityFlags": ["low_light" | "folded_or_creased" | "blurred" | "handwritten" | "partial_occlusion" | "skewed"],
  "extractionSucceeded": true|false,
  "errors": ["..."]
}`;

    try {
      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 2000,
        system: systemPrompt,
        messages: [{
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: mediaType as any, data: base64 } },
            { type: "text", text: userPrompt },
          ],
        }],
      });

      const textBlock = response.content.find(b => b.type === "text");
      const raw = (textBlock as any)?.text ?? "{}";
      const cleaned = raw.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(cleaned) as RawExtractionResult;
      return parsed;
    } catch (err: any) {
      return {
        fields: {},
        qualityFlags: [],
        extractionSucceeded: false,
        errors: [`Extraction failed: ${err.message ?? "unknown error"}`],
      };
    }
  }
}