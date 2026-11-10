CREATE TYPE "public"."auth_security_event_type" AS ENUM('account_created', 'sign_in_succeeded', 'sign_in_failed', 'sign_out', 'session_revoked');--> statement-breakpoint
CREATE TYPE "public"."auth_throttle_scope" AS ENUM('global', 'identity');--> statement-breakpoint
CREATE TABLE "auth_security_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"event_type" "auth_security_event_type" NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "auth_security_event_attribution" CHECK (("auth_security_events"."event_type" = 'sign_in_failed') = ("auth_security_events"."user_id" is null))
);
--> statement-breakpoint
CREATE TABLE "auth_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token_hash" "bytea" NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"idle_expires_at" timestamp with time zone NOT NULL,
	"absolute_expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	CONSTRAINT "auth_sessions_token_hash_unique" UNIQUE("token_hash"),
	CONSTRAINT "auth_sessions_digest_length" CHECK (octet_length("auth_sessions"."token_hash") = 32),
	CONSTRAINT "auth_sessions_expiry_order" CHECK ("auth_sessions"."created_at" <= "auth_sessions"."idle_expires_at" and "auth_sessions"."idle_expires_at" <= "auth_sessions"."absolute_expires_at"),
	CONSTRAINT "auth_sessions_revocation_order" CHECK ("auth_sessions"."revoked_at" is null or "auth_sessions"."revoked_at" >= "auth_sessions"."created_at")
);
--> statement-breakpoint
CREATE TABLE "auth_throttle_buckets" (
	"scope" "auth_throttle_scope" NOT NULL,
	"bucket_key" "bytea" NOT NULL,
	"attempt_count" integer DEFAULT 0 NOT NULL,
	"window_ends_at" timestamp with time zone NOT NULL,
	"next_allowed_at" timestamp with time zone NOT NULL,
	CONSTRAINT "auth_throttle_buckets_scope_bucket_key_pk" PRIMARY KEY("scope","bucket_key"),
	CONSTRAINT "auth_throttle_bucket_digest_length" CHECK (octet_length("auth_throttle_buckets"."bucket_key") = 32),
	CONSTRAINT "auth_throttle_attempt_bounds" CHECK ("auth_throttle_buckets"."attempt_count" between 0 and 32767)
);
--> statement-breakpoint
CREATE TABLE "password_credentials" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"password_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"password_changed_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "password_credentials_argon2id" CHECK ("password_credentials"."password_hash" like '$argon2id$%' and length("password_credentials"."password_hash") <= 512)
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"normalized_email" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_normalized_email_unique" UNIQUE("normalized_email"),
	CONSTRAINT "users_email_length" CHECK (length("users"."normalized_email") between 3 and 254)
);
--> statement-breakpoint
ALTER TABLE "auth_security_events" ADD CONSTRAINT "auth_security_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth_sessions" ADD CONSTRAINT "auth_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "password_credentials" ADD CONSTRAINT "password_credentials_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "auth_security_events_time_idx" ON "auth_security_events" USING btree ("occurred_at");--> statement-breakpoint
CREATE INDEX "auth_security_events_user_idx" ON "auth_security_events" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "auth_sessions_user_idx" ON "auth_sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "auth_sessions_idle_expiry_idx" ON "auth_sessions" USING btree ("idle_expires_at");--> statement-breakpoint
CREATE INDEX "auth_sessions_absolute_expiry_idx" ON "auth_sessions" USING btree ("absolute_expires_at");--> statement-breakpoint
CREATE INDEX "auth_sessions_revoked_idx" ON "auth_sessions" USING btree ("revoked_at") WHERE "auth_sessions"."revoked_at" is not null;--> statement-breakpoint
CREATE INDEX "auth_throttle_window_idx" ON "auth_throttle_buckets" USING btree ("window_ends_at");