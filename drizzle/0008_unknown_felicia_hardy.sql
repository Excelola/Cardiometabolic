CREATE TABLE "user_profiles" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"preferred_name" text,
	"date_of_birth" date,
	"market" text,
	CONSTRAINT "user_profiles_name_length" CHECK ("user_profiles"."preferred_name" is null or length("user_profiles"."preferred_name") between 1 and 100),
	CONSTRAINT "user_profiles_market" CHECK ("user_profiles"."market" is null or "user_profiles"."market" = 'NG')
);
--> statement-breakpoint
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;