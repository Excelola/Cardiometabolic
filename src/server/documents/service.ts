import "server-only";

import { and, eq, lte, sql } from "drizzle-orm";

import type { HealthEntry } from "@/domain/health-records";
import type { AuthDb } from "@/server/db/auth-db";
import { requireHealthWritePermission } from "@/server/auth/health-write-policy";
import { healthDocumentCandidates, healthDocumentUploads } from "@/server/db/document-schema";
import { parseHealthForm } from "@/server/health/input";
import { insertRecord } from "@/server/health/repository";
import { validateDocument, type DocumentFailure } from "./file-validation";
import { mapOcrCandidates } from "./mapper";
import type { DocumentOcrProvider, MalwareScanner } from "./providers";

export type UploadFailure = DocumentFailure | "unsafe_file" | "extraction_unavailable" | "temporary_service_problem";
export type UploadResult = { id: string; status: "review" | "empty" } | { error: UploadFailure };
export type ReviewCandidate = typeof healthDocumentCandidates.$inferSelect;

export async function processDocumentUpload(db: AuthDb, ownerId: string, file: File,
  scanner: MalwareScanner, ocr: DocumentOcrProvider): Promise<UploadResult> {
  await db.transaction((tx) => requireHealthWritePermission(tx, ownerId));
  if (file.size > 10 * 1024 * 1024) return { error: "file_too_large" };
  let bytes: Buffer;
  try { bytes = Buffer.from(await file.arrayBuffer()); } catch { return { error: "unreadable_file" }; }
  try {
    const validated = await validateDocument(bytes, file.type);
    if (typeof validated === "string") return { error: validated };
    const scan = await scanner.scan(bytes, validated.mime).catch(() => "unavailable" as const);
    if (scan === "infected") return { error: "unsafe_file" };
    if (scan !== "clean") return { error: "temporary_service_problem" };

    const [upload] = await db.insert(healthDocumentUploads).values({
      ownerUserId: ownerId, mimeType: validated.mime, byteSize: bytes.length, pageCount: validated.pageCount,
      expiresAt: sql`now() + interval '24 hours'`,
    }).returning({ id: healthDocumentUploads.id });
    try {
      const result = await ocr.extract(bytes, validated.mime);
      const candidates = mapOcrCandidates(result);
      await db.transaction(async (tx) => {
        await requireHealthWritePermission(tx, ownerId);
        if (candidates.length) await tx.insert(healthDocumentCandidates).values(candidates.map((candidate) => ({ uploadId: upload.id, ...candidate })));
        await tx.update(healthDocumentUploads).set({ status: candidates.length ? "review" : "empty" })
          .where(and(eq(healthDocumentUploads.id, upload.id), eq(healthDocumentUploads.ownerUserId, ownerId)));
      });
      return { id: upload.id, status: candidates.length ? "review" : "empty" };
    } catch {
      await db.update(healthDocumentUploads).set({ status: "failed", errorCategory: "extraction_unavailable" })
        .where(and(eq(healthDocumentUploads.id, upload.id), eq(healthDocumentUploads.ownerUserId, ownerId))).catch(() => {});
      return { error: "extraction_unavailable" };
    }
  } finally {
    bytes.fill(0);
  }
}

export async function getOwnedReview(db: AuthDb, ownerId: string, uploadId: string) {
  const [upload] = await db.select().from(healthDocumentUploads)
    .where(and(eq(healthDocumentUploads.id, uploadId), eq(healthDocumentUploads.ownerUserId, ownerId))).limit(1);
  if (!upload || upload.expiresAt <= new Date() || !["review", "empty"].includes(upload.status)) return null;
  const candidates = await db.select().from(healthDocumentCandidates).where(eq(healthDocumentCandidates.uploadId, uploadId));
  return { upload, candidates };
}

function candidateEntry(candidate: ReviewCandidate, form: FormData): HealthEntry | null {
  const prefix = `${candidate.id}:`;
  const selected = form.get(`${prefix}selection`);
  if (selected !== "include") return null;
  const payload = new FormData();
  payload.set("csrf", "review");
  payload.set("type", candidate.recordType);
  const fields = candidate.recordType === "blood_pressure" ? ["systolic", "diastolic"]
    : candidate.recordType === "lipid_panel" ? ["totalCholesterol", "hdl", "ldl", "triglycerides", "unit"]
      : candidate.recordType === "blood_glucose" ? ["value", "unit", "context"]
        : candidate.recordType === "hba1c" ? ["value"] : ["value", "unit"];
  payload.set("occurredAt", String(form.get(`${prefix}occurredAt`) ?? ""));
  for (const field of fields) payload.set(field, String(form.get(`${prefix}${field}`) ?? ""));
  return parseHealthForm(payload, false);
}

export type ConfirmResult = "confirmed" | "expired" | "unavailable" | "invalid";
export async function confirmDocumentUpload(db: AuthDb, ownerId: string, uploadId: string, form: FormData): Promise<ConfirmResult> {
  return db.transaction(async (tx) => {
    await requireHealthWritePermission(tx, ownerId);
    const [upload] = await tx.select().from(healthDocumentUploads)
      .where(and(eq(healthDocumentUploads.id, uploadId), eq(healthDocumentUploads.ownerUserId, ownerId))).for("update");
    if (!upload) return "unavailable";
    if (upload.expiresAt <= new Date()) return "expired";
    if (upload.status !== "review") return "unavailable";
    const candidates = await tx.select().from(healthDocumentCandidates).where(eq(healthDocumentCandidates.uploadId, uploadId));
    if (!candidates.length) return "invalid";
    const entries: { candidate: ReviewCandidate; entry: HealthEntry }[] = [];
    for (const candidate of candidates) {
      const selection = form.get(`${candidate.id}:selection`);
      if (selection !== "include" && selection !== "remove") return "invalid";
      if (selection === "remove") continue;
      const entry = candidateEntry(candidate, form);
      if (!entry) return "invalid";
      entries.push({ candidate, entry });
    }
    if (!entries.length) return "invalid";
    for (const { candidate, entry } of entries) {
      await insertRecord(tx, ownerId, entry, undefined, "document_assisted");
      await tx.update(healthDocumentCandidates).set({ state: "confirmed" }).where(eq(healthDocumentCandidates.id, candidate.id));
    }
    await tx.update(healthDocumentUploads).set({ status: "confirmed", finalizedAt: new Date() })
      .where(and(eq(healthDocumentUploads.id, uploadId), eq(healthDocumentUploads.ownerUserId, ownerId)));
    await tx.delete(healthDocumentCandidates).where(eq(healthDocumentCandidates.uploadId, uploadId));
    return "confirmed";
  });
}

export async function cancelDocumentUpload(db: AuthDb, ownerId: string, uploadId: string) {
  return db.transaction(async (tx) => {
    const [upload] = await tx.select().from(healthDocumentUploads)
      .where(and(eq(healthDocumentUploads.id, uploadId), eq(healthDocumentUploads.ownerUserId, ownerId))).for("update");
    if (!upload || !["review", "empty"].includes(upload.status)) return false;
    await tx.delete(healthDocumentCandidates).where(eq(healthDocumentCandidates.uploadId, uploadId));
    await tx.update(healthDocumentUploads).set({ status: "cancelled", finalizedAt: new Date() })
      .where(eq(healthDocumentUploads.id, uploadId));
    return true;
  });
}

/** Idempotent, database-backed cleanup entry point for a future approved scheduler. */
export async function cleanupExpiredDocumentUploads(db: AuthDb): Promise<number> {
  return db.transaction(async (tx) => {
    const expired = await tx.select({ id: healthDocumentUploads.id }).from(healthDocumentUploads)
      .where(lte(healthDocumentUploads.expiresAt, new Date())).for("update", { skipLocked: true });
    if (!expired.length) return 0;
    for (const { id } of expired) await tx.delete(healthDocumentUploads).where(eq(healthDocumentUploads.id, id));
    return expired.length;
  });
}
