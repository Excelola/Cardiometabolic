CREATE TABLE "auth_recovery_throttle_buckets" (
	"bucket_key" "bytea" PRIMARY KEY NOT NULL,
	"attempt_count" integer DEFAULT 0 NOT NULL,
	"window_ends_at" timestamp with time zone NOT NULL,
	CONSTRAINT "auth_recovery_throttle_key_length" CHECK (octet_length("auth_recovery_throttle_buckets"."bucket_key") = 32),
	CONSTRAINT "auth_recovery_throttle_attempt_bounds" CHECK ("auth_recovery_throttle_buckets"."attempt_count" between 0 and 32767)
);
--> statement-breakpoint
CREATE INDEX "auth_recovery_throttle_expiry_idx" ON "auth_recovery_throttle_buckets" USING btree ("window_ends_at");