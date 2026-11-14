CREATE TYPE "public"."auth_email_challenge_purpose" AS ENUM('verify_email', 'reset_password');--> statement-breakpoint
CREATE TABLE "auth_email_challenges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"purpose" "auth_email_challenge_purpose" NOT NULL,
	"digest" "bytea" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"consumed_at" timestamp with time zone,
	"failed_attempts" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "auth_email_challenge_digest_length" CHECK (octet_length("auth_email_challenges"."digest") = 32),
	CONSTRAINT "auth_email_challenge_time_order" CHECK ("auth_email_challenges"."expires_at" > "auth_email_challenges"."created_at" and ("auth_email_challenges"."consumed_at" is null or "auth_email_challenges"."consumed_at" >= "auth_email_challenges"."created_at")),
	CONSTRAINT "auth_email_challenge_attempt_bounds" CHECK ("auth_email_challenges"."failed_attempts" between 0 and 5)
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "email_verified_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "legacy_recovery_restricted" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "verification_required_for_health" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "verification_required_for_health" SET DEFAULT true;--> statement-breakpoint
ALTER TABLE "auth_email_challenges" ADD CONSTRAINT "auth_email_challenges_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "auth_email_challenge_owner_purpose_idx" ON "auth_email_challenges" USING btree ("user_id","purpose");--> statement-breakpoint
CREATE INDEX "auth_email_challenge_expiry_idx" ON "auth_email_challenges" USING btree ("expires_at");
