CREATE TYPE "public"."health_document_candidate_state" AS ENUM('pending', 'included', 'removed', 'corrected', 'confirmed');--> statement-breakpoint
CREATE TYPE "public"."health_document_candidate_type" AS ENUM('blood_pressure', 'blood_glucose', 'hba1c', 'lipid_panel', 'weight', 'waist_circumference');--> statement-breakpoint
CREATE TYPE "public"."health_document_candidate_unit" AS ENUM('mmhg', 'mmol_l', 'mg_dl', 'percent', 'kg', 'lb', 'cm', 'in');--> statement-breakpoint
CREATE TYPE "public"."health_document_mime" AS ENUM('application/pdf', 'image/jpeg', 'image/png');--> statement-breakpoint
CREATE TYPE "public"."health_document_upload_status" AS ENUM('processing', 'review', 'empty', 'failed', 'confirmed', 'cancelled', 'expired');--> statement-breakpoint
ALTER TYPE "public"."health_record_provenance" ADD VALUE 'document_assisted';--> statement-breakpoint
CREATE TABLE "health_document_candidates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"upload_id" uuid NOT NULL,
	"record_type" "health_document_candidate_type" NOT NULL,
	"state" "health_document_candidate_state" DEFAULT 'pending' NOT NULL,
	"candidate_value" numeric,
	"second_value" numeric,
	"unit" "health_document_candidate_unit",
	"glucose_context" "health_glucose_context",
	"total_cholesterol_value" numeric,
	"hdl_value" numeric,
	"ldl_value" numeric,
	"triglycerides_value" numeric,
	"source_page" integer,
	"extraction_confidence" numeric,
	CONSTRAINT "health_document_candidate_source_page" CHECK ("health_document_candidates"."source_page" is null or "health_document_candidates"."source_page" between 1 and 15),
	CONSTRAINT "health_document_candidate_confidence" CHECK ("health_document_candidates"."extraction_confidence" is null or "health_document_candidates"."extraction_confidence" between 0 and 1),
	CONSTRAINT "health_document_candidate_shape" CHECK (
    case "health_document_candidates"."record_type"
      when 'blood_pressure' then "health_document_candidates"."candidate_value" is not null and "health_document_candidates"."second_value" is not null and "health_document_candidates"."unit" = 'mmhg'
      when 'blood_glucose' then "health_document_candidates"."candidate_value" is not null and "health_document_candidates"."second_value" is null and "health_document_candidates"."unit" in ('mmol_l', 'mg_dl') and "health_document_candidates"."glucose_context" is not null
      when 'hba1c' then "health_document_candidates"."candidate_value" is not null and "health_document_candidates"."second_value" is null and "health_document_candidates"."unit" = 'percent'
      when 'lipid_panel' then "health_document_candidates"."candidate_value" is null and "health_document_candidates"."second_value" is null and "health_document_candidates"."unit" in ('mmol_l', 'mg_dl')
        and num_nonnulls("health_document_candidates"."total_cholesterol_value", "health_document_candidates"."hdl_value", "health_document_candidates"."ldl_value", "health_document_candidates"."triglycerides_value") > 0
      when 'weight' then "health_document_candidates"."candidate_value" is not null and "health_document_candidates"."second_value" is null and "health_document_candidates"."unit" in ('kg', 'lb')
      when 'waist_circumference' then "health_document_candidates"."candidate_value" is not null and "health_document_candidates"."second_value" is null and "health_document_candidates"."unit" in ('cm', 'in')
      else false
    end
    and ("health_document_candidates"."record_type" = 'lipid_panel' or num_nonnulls("health_document_candidates"."total_cholesterol_value", "health_document_candidates"."hdl_value", "health_document_candidates"."ldl_value", "health_document_candidates"."triglycerides_value") = 0)
    and ("health_document_candidates"."record_type" = 'blood_glucose' or "health_document_candidates"."glucose_context" is null)
  )
);
--> statement-breakpoint
CREATE TABLE "health_document_uploads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_user_id" uuid NOT NULL,
	"status" "health_document_upload_status" DEFAULT 'processing' NOT NULL,
	"mime_type" "health_document_mime" NOT NULL,
	"byte_size" integer NOT NULL,
	"page_count" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"finalized_at" timestamp with time zone,
	"error_category" text,
	CONSTRAINT "health_document_upload_size" CHECK ("health_document_uploads"."byte_size" between 1 and 10485760),
	CONSTRAINT "health_document_upload_pages" CHECK ("health_document_uploads"."page_count" is null or "health_document_uploads"."page_count" between 1 and 15),
	CONSTRAINT "health_document_upload_expiry" CHECK ("health_document_uploads"."expires_at" > "health_document_uploads"."created_at" and "health_document_uploads"."expires_at" <= "health_document_uploads"."created_at" + interval '24 hours')
);
--> statement-breakpoint
ALTER TABLE "health_document_candidates" ADD CONSTRAINT "health_document_candidates_upload_id_health_document_uploads_id_fk" FOREIGN KEY ("upload_id") REFERENCES "public"."health_document_uploads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "health_document_uploads" ADD CONSTRAINT "health_document_uploads_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "health_document_candidate_upload_idx" ON "health_document_candidates" USING btree ("upload_id");--> statement-breakpoint
CREATE INDEX "health_document_upload_owner_idx" ON "health_document_uploads" USING btree ("owner_user_id");--> statement-breakpoint
CREATE INDEX "health_document_upload_expiry_idx" ON "health_document_uploads" USING btree ("expires_at");