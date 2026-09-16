import { MatchStatus } from "@shared/types/reconciliation.types";

/**
 * Standard Levenshtein edit distance.
 */
function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,      // deletion
        dp[i][j - 1] + 1,      // insertion
        dp[i - 1][j - 1] + cost // substitution
      );
    }
  }
  return dp[m][n];
}

function normalizedSimilarity(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  return 1 - levenshteinDistance(a, b) / maxLen;
}

/**
 * Vehicle registration plates get pre-normalized before fuzzy comparison:
 * uppercased, whitespace/hyphens stripped, and common OCR confusions
 * (O<->0, I<->1, S<->5, B<->8) are treated as equivalent via char-class mapping,
 * since these are the most frequent misreads on worn/blurred plates.
 */
export function normalizeVehicleReg(raw: string): string {
  return raw
    .toUpperCase()
    .replace(/[\s\-]/g, "")
    .replace(/O/g, "0")
    .replace(/I/g, "1")
    .replace(/S/g, "5")
    .replace(/B/g, "8");
}

export function fuzzyMatchVehicleReg(
  gatePassReg: string,
  weighbridgeReg: string,
  minSimilarity: number
): { status: MatchStatus; score: number } {
  const a = normalizeVehicleReg(gatePassReg);
  const b = normalizeVehicleReg(weighbridgeReg);
  const score = normalizedSimilarity(a, b);

  if (score >= minSimilarity) return { status: "match", score };
  if (score >= minSimilarity - 0.15) return { status: "warning", score };
  return { status: "mismatch", score };
}

export function fuzzyMatchString(
  a: string,
  b: string,
  minSimilarity: number
): { status: MatchStatus; score: number } {
  const score = normalizedSimilarity(a.trim().toLowerCase(), b.trim().toLowerCase());
  if (score >= minSimilarity) return { status: "match", score };
  if (score >= minSimilarity - 0.1) return { status: "warning", score };
  return { status: "mismatch", score };
}