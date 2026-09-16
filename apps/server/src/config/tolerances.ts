export const TOLERANCE_CONFIG = {
  netWeight: {
    type: "percentage" as const,
    threshold: 0.5,          // ±0.5%
    minAbsoluteFloorKg: 2,   // for very light loads, apply at least ±2kg so rounding doesn't false-flag
  },
  grossWeight: {
    type: "percentage" as const,
    threshold: 0.5,
    minAbsoluteFloorKg: 2,
  },
  tareWeight: {
    type: "percentage" as const,
    threshold: 0.75,         // tare tends to drift slightly more (fuel, driver weight)
    minAbsoluteFloorKg: 3,
  },
  date: {
    graceWindowDays: 0,      // exact match; gate pass & weighbridge should be same calendar day
  },
  vehicleRegNumber: {
    type: "fuzzy_string" as const,
    minSimilarity: 0.85,     // Levenshtein-normalized similarity
  },
  farmerId: {
    type: "exact" as const,
  },
  tokenId: {
    type: "exact" as const,
  },
  commodityType: {
    type: "fuzzy_string" as const,
    minSimilarity: 0.8,      // tolerate "Wheat" vs "wheat " vs OCR noise
  },
  lowConfidenceThreshold: 0.6,
} as const;

export type ToleranceConfig = typeof TOLERANCE_CONFIG;