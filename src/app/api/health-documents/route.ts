import { getAuthConfig } from "@/server/auth/config";
import { isTrustedAuthOrigin, verifySessionCsrf } from "@/server/auth/mutation-security";
import { getCurrentSession } from "@/server/auth/request-session";
import { getAuthDb } from "@/server/db/auth-db";
import { MAX_DOCUMENT_BYTES } from "@/server/documents/file-validation";
import { developmentProviders } from "@/server/documents/providers";
import { processDocumentUpload, type UploadFailure } from "@/server/documents/service";

export const runtime = "nodejs";

// Multipart framing is bounded separately from the approved 10 MiB file limit.
const MAX_REQUEST_BYTES = MAX_DOCUMENT_BYTES + 64 * 1024;
const errorMessages: Record<UploadFailure, string> = {
  unsupported_file: "Use a PDF, JPEG, or PNG document.",
  file_too_large: "Choose a file no larger than 10 MB.",
  too_many_pages: "Choose a PDF with no more than 15 pages.",
  encrypted_pdf: "Password-protected PDFs are not supported.",
  unreadable_file: "We couldn’t read this file. Try another PDF, JPEG, or PNG.",
  unsafe_file: "This file could not be accepted safely.",
  extraction_unavailable: "Document extraction is unavailable. Please try again later.",
  temporary_service_problem: "Document upload is unavailable right now. Please try again later.",
};

function failure(message: string, status: number) {
  return Response.json({ error: message }, { status, headers: { "Cache-Control": "no-store" } });
}

async function boundedMultipart(request: Request): Promise<FormData | "too_large" | "invalid"> {
  const contentType = request.headers.get("content-type");
  if (!contentType || !/^multipart\/form-data\s*;\s*boundary=[^\s;]+(?:;.*)?$/i.test(contentType)) return "invalid";
  const declaredLength = request.headers.get("content-length");
  if (declaredLength && (!/^\d+$/.test(declaredLength) || Number(declaredLength) > MAX_REQUEST_BYTES)) return "too_large";
  if (!request.body) return "invalid";
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_REQUEST_BYTES) {
        await reader.cancel();
        return "too_large";
      }
      chunks.push(value);
    }
    const body = Buffer.concat(chunks, size);
    try {
      return await new Request(request.url, { method: "POST", headers: { "content-type": contentType }, body }).formData();
    } finally {
      body.fill(0);
    }
  } catch {
    return "invalid";
  } finally {
    reader.releaseLock();
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    const config = getAuthConfig();
    if (!isTrustedAuthOrigin(request.headers, config)) return failure("We couldn’t verify this request. Reload and try again.", 403);
    const principal = await getCurrentSession();
    if (!principal || !verifySessionCsrf(principal.sessionId, request.headers.get("x-hilera-csrf"), config.csrfSecret))
      return failure("We couldn’t verify this request. Reload and try again.", 403);
    const providers = developmentProviders();
    if (!providers) return failure(errorMessages.temporary_service_problem, 503);
    const form = await boundedMultipart(request);
    if (form === "too_large") return failure(errorMessages.file_too_large, 413);
    if (form === "invalid" || [...form.keys()].some((key) => key !== "file")) return failure("Choose one supported file.", 400);
    const files = form.getAll("file");
    if (files.length !== 1 || !(files[0] instanceof File)) return failure("Choose one supported file.", 400);
    if (files[0].size > MAX_DOCUMENT_BYTES) return failure(errorMessages.file_too_large, 413);
    const result = await processDocumentUpload(getAuthDb(), principal.userId, files[0], providers.scanner, providers.ocr);
    if ("error" in result) return failure(errorMessages[result.error], 400);
    return Response.json({ id: result.id }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch {
    return failure(errorMessages.temporary_service_problem, 503);
  }
}
