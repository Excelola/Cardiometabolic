import { sql } from "drizzle-orm";
import { boolean, check, customType, index, integer, pgEnum, pgTable, primaryKey, text, timestamp, uuid } from "drizzle-orm/pg-core";

const bytes = customType<{ data: Buffer }>({ dataType: () => "bytea" });
const instant = (name: string) => timestamp(name, { withTimezone: true });

export const users = pgTable("users", {
  id: uuid().defaultRandom().primaryKey(),
  normalizedEmail: text("normalized_email").notNull().unique("users_normalized_email_unique"),
  createdAt: instant("created_at").notNull().defaultNow(),
  emailVerifiedAt: instant("email_verified_at"),
  legacyRecoveryRestricted: boolean("legacy_recovery_restricted").notNull().default(true),
  verificationRequiredForHealth: boolean("verification_required_for_health").notNull().default(true),
}, (table) => [check("users_email_length", sql`length(${table.normalizedEmail}) between 3 and 254`)]);

export const emailChallengePurpose = pgEnum("auth_email_challenge_purpose", ["verify_email", "reset_password"]);
export const authEmailChallenges = pgTable("auth_email_challenges", {
  id: uuid().defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "restrict" }),
  purpose: emailChallengePurpose().notNull(),
  digest: bytes("digest").notNull(),
  createdAt: instant("created_at").notNull().defaultNow(),
  expiresAt: instant("expires_at").notNull(),
  activatedAt: instant("activated_at"),
  consumedAt: instant("consumed_at"),
  failedAttempts: integer("failed_attempts").notNull().default(0),
}, (table) => [
  check("auth_email_challenge_digest_length", sql`octet_length(${table.digest}) = 32`),
  check("auth_email_challenge_time_order", sql`${table.expiresAt} > ${table.createdAt} and ${table.expiresAt} <= ${table.createdAt} + interval '10 minutes'
    and (${table.activatedAt} is null or (${table.activatedAt} >= ${table.createdAt} and ${table.activatedAt} < ${table.expiresAt}))
    and (${table.consumedAt} is null or ${table.consumedAt} >= ${table.createdAt})`),
  check("auth_email_challenge_attempt_bounds", sql`${table.failedAttempts} between 0 and 5`),
  index("auth_email_challenge_owner_purpose_idx").on(table.userId, table.purpose),
  index("auth_email_challenge_expiry_idx").on(table.expiresAt),
]);

export const recoveryThrottleBuckets = pgTable("auth_recovery_throttle_buckets", {
  bucketKey: bytes("bucket_key").primaryKey(),
  attemptCount: integer("attempt_count").notNull().default(0),
  windowEndsAt: instant("window_ends_at").notNull(),
}, (table) => [
  check("auth_recovery_throttle_key_length", sql`octet_length(${table.bucketKey}) = 32`),
  check("auth_recovery_throttle_attempt_bounds", sql`${table.attemptCount} between 0 and 32767`),
  index("auth_recovery_throttle_expiry_idx").on(table.windowEndsAt),
]);

export const passwordCredentials = pgTable("password_credentials", {
  userId: uuid("user_id").primaryKey().references(() => users.id, { onDelete: "restrict" }),
  passwordHash: text("password_hash").notNull(),
  createdAt: instant("created_at").notNull().defaultNow(),
  passwordChangedAt: instant("password_changed_at").notNull().defaultNow(),
}, (table) => [
  check("password_credentials_argon2id", sql`${table.passwordHash} like '$argon2id$%' and length(${table.passwordHash}) <= 512`),
]);

export const authSessions = pgTable("auth_sessions", {
  id: uuid().defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "restrict" }),
  tokenHash: bytes("token_hash").notNull().unique("auth_sessions_token_hash_unique"),
  createdAt: instant("created_at").notNull(),
  idleExpiresAt: instant("idle_expires_at").notNull(),
  absoluteExpiresAt: instant("absolute_expires_at").notNull(),
  revokedAt: instant("revoked_at"),
}, (table) => [
  check("auth_sessions_digest_length", sql`octet_length(${table.tokenHash}) = 32`),
  check("auth_sessions_expiry_order", sql`${table.createdAt} <= ${table.idleExpiresAt} and ${table.idleExpiresAt} <= ${table.absoluteExpiresAt}`),
  check("auth_sessions_revocation_order", sql`${table.revokedAt} is null or ${table.revokedAt} >= ${table.createdAt}`),
  index("auth_sessions_user_idx").on(table.userId),
  index("auth_sessions_idle_expiry_idx").on(table.idleExpiresAt),
  index("auth_sessions_absolute_expiry_idx").on(table.absoluteExpiresAt),
  index("auth_sessions_revoked_idx").on(table.revokedAt).where(sql`${table.revokedAt} is not null`),
]);

export const throttleScope = pgEnum("auth_throttle_scope", ["global", "identity"]);
export const authThrottleBuckets = pgTable("auth_throttle_buckets", {
  scope: throttleScope().notNull(),
  bucketKey: bytes("bucket_key").notNull(),
  attemptCount: integer("attempt_count").notNull().default(0),
  windowEndsAt: instant("window_ends_at").notNull(),
  nextAllowedAt: instant("next_allowed_at").notNull(),
}, (table) => [
  primaryKey({ columns: [table.scope, table.bucketKey] }),
  check("auth_throttle_bucket_digest_length", sql`octet_length(${table.bucketKey}) = 32`),
  check("auth_throttle_attempt_bounds", sql`${table.attemptCount} between 0 and 32767`),
  index("auth_throttle_window_idx").on(table.windowEndsAt),
]);

export const eventType = pgEnum("auth_security_event_type", [
  "account_created", "sign_in_succeeded", "sign_in_failed", "sign_out", "session_revoked", "email_verified", "password_reset_completed",
]);
export const authSecurityEvents = pgTable("auth_security_events", {
  id: uuid().defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "restrict" }),
  eventType: eventType("event_type").notNull(),
  occurredAt: instant("occurred_at").notNull().defaultNow(),
}, (table) => [
  check("auth_security_event_attribution", sql`(${table.eventType} = 'sign_in_failed') = (${table.userId} is null)`),
  index("auth_security_events_time_idx").on(table.occurredAt),
  index("auth_security_events_user_idx").on(table.userId),
]);
