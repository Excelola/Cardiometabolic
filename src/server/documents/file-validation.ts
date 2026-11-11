import "server-only";

import sharp from "sharp";

export const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;
export type DocumentMime = "application/pdf" | "image/jpeg" | "image/png";
export type DocumentFailure = "unsupported_file" | "file_too_large" | "too_many_pages" | "encrypted_pdf" | "unreadable_file";
export type ValidatedDocument = { bytes: Buffer; mime: DocumentMime; pageCount: number };

function pngValid(bytes: Buffer): boolean {
  if (bytes.length < 45 || !bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return false;
  if (bytes.readUInt32BE(8) !== 13 || bytes.toString("ascii", 12, 16) !== "IHDR") return false;
  const width = bytes.readUInt32BE(16), height = bytes.readUInt32BE(20);
  if (!width || !height || width > 20000 || height > 20000) return false;
  let offset = 8;
  let ended = false;
  while (offset + 12 <= bytes.length) {
    const length = bytes.readUInt32BE(offset);
    if (length > MAX_DOCUMENT_BYTES || offset + 12 + length > bytes.length) return false;
    const type = bytes.toString("ascii", offset + 4, offset + 8);
    offset += length + 12;
    if (type === "IEND") { ended = length === 0 && offset === bytes.length; break; }
  }
  return ended;
}

function jpegValid(bytes: Buffer): boolean {
  if (bytes.length < 16 || bytes[0] !== 0xff || bytes[1] !== 0xd8 || bytes.at(-2) !== 0xff || bytes.at(-1) !== 0xd9) return false;
  let offset = 2, dimensions = false;
  while (offset + 4 < bytes.length - 2) {
    if (bytes[offset++] !== 0xff) return false;
    let marker = bytes[offset++];
    while (marker === 0xff) marker = bytes[offset++];
    if (marker === 0xda) return dimensions;
    if (marker === 0xd9 || marker === 0x00 || offset + 2 > bytes.length) return false;
    const length = bytes.readUInt16BE(offset);
    if (length < 2 || offset + length > bytes.length - 2) return false;
    if ([0xc0, 0xc1, 0xc2, 0xc3].includes(marker)) {
      if (length < 7 || !bytes.readUInt16BE(offset + 3) || !bytes.readUInt16BE(offset + 5)) return false;
      dimensions = true;
    }
    offset += length;
  }
  return false;
}

export function classifyPdfFailure(error: unknown): "encrypted_pdf" | "unreadable_file" {
  return error instanceof Error && (error.name === "PasswordException" || /password|encrypt/i.test(error.message))
    ? "encrypted_pdf" : "unreadable_file";
}

export async function validateDocument(bytes: Buffer, declaredType: string): Promise<ValidatedDocument | DocumentFailure> {
  if (!bytes.length) return "unreadable_file";
  if (bytes.length > MAX_DOCUMENT_BYTES) return "file_too_large";
  if (declaredType === "image/png" && pngValid(bytes) || declaredType === "image/jpeg" && jpegValid(bytes)) {
    try {
      const image = sharp(bytes, { limitInputPixels: 25_000_000, failOn: "error" });
      const metadata = await image.metadata();
      if (metadata.format !== (declaredType === "image/png" ? "png" : "jpeg")) return "unreadable_file";
      await image.raw().toBuffer();
      return { bytes, mime: declaredType as "image/png" | "image/jpeg", pageCount: 1 };
    } catch { return "unreadable_file"; }
  }
  if (declaredType === "application/pdf" && bytes.subarray(0, 5).toString("ascii") === "%PDF-") {
    try {
      const { getDocument } = await import("pdfjs-dist/legacy/build/pdf.mjs");
      const task = getDocument({ data: new Uint8Array(bytes), stopAtErrors: true, verbosity: 0,
        useSystemFonts: false, disableFontFace: true });
      try {
        const pdf = await task.promise;
        const pageCount = pdf.numPages;
        if (pageCount > 15) return "too_many_pages";
        for (let page = 1; page <= pageCount; page++) await pdf.getPage(page);
        return pageCount > 0 ? { bytes, mime: "application/pdf", pageCount } : "unreadable_file";
      } finally { await task.destroy(); }
    } catch (error) {
      return classifyPdfFailure(error);
    }
  }
  return ["image/png", "image/jpeg", "application/pdf"].includes(declaredType) ? "unreadable_file" : "unsupported_file";
}
