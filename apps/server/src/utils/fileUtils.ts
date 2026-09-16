import fs from "fs/promises";
import path from "path";

export async function readFileAsBase64(filePath: string): Promise<string> {
  return (await fs.readFile(filePath)).toString("base64");
}

export function mimeTypeOf(mimeType: string): "image/jpeg" | "image/png" | "image/webp" {
  if (mimeType === "image/png") return "image/png";
  if (mimeType === "image/webp") return "image/webp";
  return "image/jpeg";
}

export function ensureDirectory(directory: string): Promise<void> {
  return fs.mkdir(path.resolve(directory), { recursive: true }).then(() => undefined);
}
