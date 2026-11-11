import { sql } from "drizzle-orm";
import { check, index, integer, numeric, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { users } from "./schema";
import { glucoseContext } from "./health-schema";

export const documentUploadStatus = pgEnum("health_document_upload_status", [
  "processing", "review", "empty", "failed", "confirmed", "cancelled", "expired",
]);
export const documentMime = pgEnum("health_document_mime", ["application/pdf", "image/jpeg", "image/png"]);
export const documentCandidateType = pgEnum("health_document_candidate_type", [
  "blood_pressure", "blood_glucose", "hba1c", "lipid_panel", "weight", "waist_circumference",
]);
export const documentCandidateState = pgEnum("health_document_candidate_state", [
  "pending", "included", "removed", "corrected", "confirmed",
]);
export const documentCandidateUnit = pgEnum("health_document_candidate_unit", ["mmhg", "mmol_l", "mg_dl", "percent", "kg", "lb", "cm", "in"]);

export const healthDocumentUploads = pgTable("health_document_uploads", {
  id: uuid().defaultRandom().primaryKey(),
  ownerUserId: uuid("owner_user_id").notNull().references(() => users.id, { onDelete: "restrict" }),
  status: documentUploadStatus().notNull().default("processing"),
  mimeType: documentMime("mime_type").notNull(),
  byteSize: integer("byte_size").notNull(),
  pageCount: integer("page_count"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  finalizedAt: timestamp("finalized_at", { withTimezone: true }),
  errorCategory: text("error_category"),
}, (t) => [
  check("health_document_upload_size", sql`${t.byteSize} between 1 and 10485760`),
  check("health_document_upload_pages", sql`${t.pageCount} is null or ${t.pageCount} between 1 and 15`),
  check("health_document_upload_expiry", sql`${t.expiresAt} > ${t.createdAt} and ${t.expiresAt} <= ${t.createdAt} + interval '24 hours'`),
  index("health_document_upload_owner_idx").on(t.ownerUserId),
  index("health_document_upload_expiry_idx").on(t.expiresAt),
]);

export const healthDocumentCandidates = pgTable("health_document_candidates", {
  id: uuid().defaultRandom().primaryKey(),
  uploadId: uuid("upload_id").notNull().references(() => healthDocumentUploads.id, { onDelete: "cascade" }),
  recordType: documentCandidateType("record_type").notNull(),
  state: documentCandidateState().notNull().default("pending"),
  value: numeric("candidate_value"),
  secondValue: numeric("second_value"),
  unit: documentCandidateUnit("unit"),
  glucoseContext: glucoseContext("glucose_context"),
  totalCholesterol: numeric("total_cholesterol_value"),
  hdl: numeric("hdl_value"),
  ldl: numeric("ldl_value"),
  triglycerides: numeric("triglycerides_value"),
  sourcePage: integer("source_page"),
  extractionConfidence: numeric("extraction_confidence"),
}, (t) => [
  check("health_document_candidate_source_page", sql`${t.sourcePage} is null or ${t.sourcePage} between 1 and 15`),
  check("health_document_candidate_confidence", sql`${t.extractionConfidence} is null or ${t.extractionConfidence} between 0 and 1`),
  check("health_document_candidate_shape", sql`
    case ${t.recordType}
      when 'blood_pressure' then ${t.value} is not null and ${t.secondValue} is not null and ${t.unit} = 'mmhg'
      when 'blood_glucose' then ${t.value} is not null and ${t.secondValue} is null and ${t.unit} in ('mmol_l', 'mg_dl') and ${t.glucoseContext} is not null
      when 'hba1c' then ${t.value} is not null and ${t.secondValue} is null and ${t.unit} = 'percent'
      when 'lipid_panel' then ${t.value} is null and ${t.secondValue} is null and ${t.unit} in ('mmol_l', 'mg_dl')
        and num_nonnulls(${t.totalCholesterol}, ${t.hdl}, ${t.ldl}, ${t.triglycerides}) > 0
      when 'weight' then ${t.value} is not null and ${t.secondValue} is null and ${t.unit} in ('kg', 'lb')
      when 'waist_circumference' then ${t.value} is not null and ${t.secondValue} is null and ${t.unit} in ('cm', 'in')
      else false
    end
    and (${t.recordType} = 'lipid_panel' or num_nonnulls(${t.totalCholesterol}, ${t.hdl}, ${t.ldl}, ${t.triglycerides}) = 0)
    and (${t.recordType} = 'blood_glucose' or ${t.glucoseContext} is null)
  `),
  index("health_document_candidate_upload_idx").on(t.uploadId),
]);
