CREATE TYPE "public"."health_concentration_unit" AS ENUM('mmol_l', 'mg_dl');--> statement-breakpoint
CREATE TYPE "public"."health_glucose_context" AS ENUM('fasting', 'before_meal', 'after_meal', 'random_other', 'not_specified');--> statement-breakpoint
CREATE TYPE "public"."health_record_provenance" AS ENUM('user_entered');--> statement-breakpoint
CREATE TYPE "public"."health_record_type" AS ENUM('blood_pressure', 'blood_glucose', 'hba1c', 'lipid_panel', 'weight', 'waist_circumference', 'physical_activity_duration', 'sleep_duration');--> statement-breakpoint
CREATE TYPE "public"."health_waist_unit" AS ENUM('cm', 'in');--> statement-breakpoint
CREATE TYPE "public"."health_weight_unit" AS ENUM('kg', 'lb');--> statement-breakpoint
CREATE TABLE "blood_glucose_records" (
	"health_record_id" uuid PRIMARY KEY NOT NULL,
	"record_type" "health_record_type" DEFAULT 'blood_glucose' NOT NULL,
	"glucose_value" numeric NOT NULL,
	"unit" "health_concentration_unit" NOT NULL,
	"context" "health_glucose_context" NOT NULL,
	CONSTRAINT "blood_glucose_type" CHECK ("blood_glucose_records"."record_type" = 'blood_glucose'),
	CONSTRAINT "blood_glucose_finite" CHECK ("blood_glucose_records"."glucose_value" not in ('NaN', 'Infinity', '-Infinity'))
);
--> statement-breakpoint
CREATE TABLE "blood_pressure_records" (
	"health_record_id" uuid PRIMARY KEY NOT NULL,
	"record_type" "health_record_type" DEFAULT 'blood_pressure' NOT NULL,
	"systolic_value" numeric NOT NULL,
	"diastolic_value" numeric NOT NULL,
	CONSTRAINT "blood_pressure_type" CHECK ("blood_pressure_records"."record_type" = 'blood_pressure'),
	CONSTRAINT "blood_pressure_finite" CHECK ("blood_pressure_records"."systolic_value" not in ('NaN', 'Infinity', '-Infinity') and "blood_pressure_records"."diastolic_value" not in ('NaN', 'Infinity', '-Infinity'))
);
--> statement-breakpoint
CREATE TABLE "hba1c_records" (
	"health_record_id" uuid PRIMARY KEY NOT NULL,
	"record_type" "health_record_type" DEFAULT 'hba1c' NOT NULL,
	"hba1c_value" numeric NOT NULL,
	CONSTRAINT "hba1c_type" CHECK ("hba1c_records"."record_type" = 'hba1c'),
	CONSTRAINT "hba1c_finite" CHECK ("hba1c_records"."hba1c_value" not in ('NaN', 'Infinity', '-Infinity'))
);
--> statement-breakpoint
CREATE TABLE "health_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"record_type" "health_record_type" NOT NULL,
	"provenance" "health_record_provenance" DEFAULT 'user_entered' NOT NULL,
	"occurred_at" timestamp with time zone,
	"occurred_on" date,
	"entered_at" timestamp with time zone DEFAULT now() NOT NULL,
	"supersedes_record_id" uuid,
	"superseded_at" timestamp with time zone,
	"superseded_by_record_id" uuid,
	CONSTRAINT "health_records_one_replacement" UNIQUE("supersedes_record_id"),
	CONSTRAINT "health_records_one_predecessor" UNIQUE("superseded_by_record_id"),
	CONSTRAINT "health_records_id_type_key" UNIQUE("id","record_type"),
	CONSTRAINT "health_records_id_owner_type_key" UNIQUE("id","user_id","record_type"),
	CONSTRAINT "health_records_occurrence_shape" CHECK (
    case when "health_records"."record_type" in ('physical_activity_duration', 'sleep_duration')
      then "health_records"."occurred_at" is null and "health_records"."occurred_on" is not null and isfinite("health_records"."occurred_on")
      else "health_records"."occurred_on" is null and "health_records"."occurred_at" is not null and isfinite("health_records"."occurred_at")
    end),
	CONSTRAINT "health_records_supersession_shape" CHECK (("health_records"."superseded_at" is null) = ("health_records"."superseded_by_record_id" is null)
    and "health_records"."supersedes_record_id" is distinct from "health_records"."id"
    and "health_records"."superseded_by_record_id" is distinct from "health_records"."id"
    and ("health_records"."supersedes_record_id" is null or "health_records"."supersedes_record_id" is distinct from "health_records"."superseded_by_record_id"))
);
--> statement-breakpoint
CREATE TABLE "lipid_panel_records" (
	"health_record_id" uuid PRIMARY KEY NOT NULL,
	"record_type" "health_record_type" DEFAULT 'lipid_panel' NOT NULL,
	"unit" "health_concentration_unit" NOT NULL,
	"total_cholesterol_value" numeric,
	"hdl_value" numeric,
	"ldl_value" numeric,
	"triglycerides_value" numeric,
	CONSTRAINT "lipid_panel_type" CHECK ("lipid_panel_records"."record_type" = 'lipid_panel'),
	CONSTRAINT "lipid_panel_has_component" CHECK (num_nonnulls("lipid_panel_records"."total_cholesterol_value", "lipid_panel_records"."hdl_value", "lipid_panel_records"."ldl_value", "lipid_panel_records"."triglycerides_value") > 0),
	CONSTRAINT "lipid_panel_finite" CHECK ("lipid_panel_records"."total_cholesterol_value" not in ('NaN', 'Infinity', '-Infinity') and "lipid_panel_records"."hdl_value" not in ('NaN', 'Infinity', '-Infinity') and "lipid_panel_records"."ldl_value" not in ('NaN', 'Infinity', '-Infinity') and "lipid_panel_records"."triglycerides_value" not in ('NaN', 'Infinity', '-Infinity'))
);
--> statement-breakpoint
CREATE TABLE "physical_activity_records" (
	"health_record_id" uuid PRIMARY KEY NOT NULL,
	"record_type" "health_record_type" DEFAULT 'physical_activity_duration' NOT NULL,
	"duration_minutes" integer NOT NULL,
	CONSTRAINT "physical_activity_type" CHECK ("physical_activity_records"."record_type" = 'physical_activity_duration'),
	CONSTRAINT "physical_activity_whole_duration" CHECK ("physical_activity_records"."duration_minutes" >= 0)
);
--> statement-breakpoint
CREATE TABLE "sleep_records" (
	"health_record_id" uuid PRIMARY KEY NOT NULL,
	"record_type" "health_record_type" DEFAULT 'sleep_duration' NOT NULL,
	"duration_minutes" integer NOT NULL,
	CONSTRAINT "sleep_type" CHECK ("sleep_records"."record_type" = 'sleep_duration'),
	CONSTRAINT "sleep_whole_duration" CHECK ("sleep_records"."duration_minutes" >= 0)
);
--> statement-breakpoint
CREATE TABLE "waist_circumference_records" (
	"health_record_id" uuid PRIMARY KEY NOT NULL,
	"record_type" "health_record_type" DEFAULT 'waist_circumference' NOT NULL,
	"waist_value" numeric NOT NULL,
	"unit" "health_waist_unit" NOT NULL,
	CONSTRAINT "waist_circumference_type" CHECK ("waist_circumference_records"."record_type" = 'waist_circumference'),
	CONSTRAINT "waist_circumference_finite" CHECK ("waist_circumference_records"."waist_value" not in ('NaN', 'Infinity', '-Infinity'))
);
--> statement-breakpoint
CREATE TABLE "weight_records" (
	"health_record_id" uuid PRIMARY KEY NOT NULL,
	"record_type" "health_record_type" DEFAULT 'weight' NOT NULL,
	"weight_value" numeric NOT NULL,
	"unit" "health_weight_unit" NOT NULL,
	CONSTRAINT "weight_type" CHECK ("weight_records"."record_type" = 'weight'),
	CONSTRAINT "weight_finite" CHECK ("weight_records"."weight_value" not in ('NaN', 'Infinity', '-Infinity'))
);
--> statement-breakpoint
ALTER TABLE "blood_glucose_records" ADD CONSTRAINT "blood_glucose_record_fk" FOREIGN KEY ("health_record_id","record_type") REFERENCES "public"."health_records"("id","record_type") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blood_pressure_records" ADD CONSTRAINT "blood_pressure_record_fk" FOREIGN KEY ("health_record_id","record_type") REFERENCES "public"."health_records"("id","record_type") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hba1c_records" ADD CONSTRAINT "hba1c_record_fk" FOREIGN KEY ("health_record_id","record_type") REFERENCES "public"."health_records"("id","record_type") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "health_records" ADD CONSTRAINT "health_records_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "health_records" ADD CONSTRAINT "health_records_predecessor_fk" FOREIGN KEY ("supersedes_record_id","user_id","record_type") REFERENCES "public"."health_records"("id","user_id","record_type") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "health_records" ADD CONSTRAINT "health_records_replacement_fk" FOREIGN KEY ("superseded_by_record_id","user_id","record_type") REFERENCES "public"."health_records"("id","user_id","record_type") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lipid_panel_records" ADD CONSTRAINT "lipid_panel_record_fk" FOREIGN KEY ("health_record_id","record_type") REFERENCES "public"."health_records"("id","record_type") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "physical_activity_records" ADD CONSTRAINT "physical_activity_record_fk" FOREIGN KEY ("health_record_id","record_type") REFERENCES "public"."health_records"("id","record_type") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sleep_records" ADD CONSTRAINT "sleep_record_fk" FOREIGN KEY ("health_record_id","record_type") REFERENCES "public"."health_records"("id","record_type") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "waist_circumference_records" ADD CONSTRAINT "waist_circumference_record_fk" FOREIGN KEY ("health_record_id","record_type") REFERENCES "public"."health_records"("id","record_type") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "weight_records" ADD CONSTRAINT "weight_record_fk" FOREIGN KEY ("health_record_id","record_type") REFERENCES "public"."health_records"("id","record_type") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "health_records_owner_idx" ON "health_records" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "health_records_current_history_idx" ON "health_records" USING btree ("user_id",coalesce("occurred_at", "occurred_on"::timestamp at time zone 'UTC') desc,"entered_at" DESC NULLS LAST,"id" DESC NULLS LAST) WHERE "health_records"."superseded_at" is null;