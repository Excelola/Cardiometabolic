import { sql } from "drizzle-orm";
import { check, customType, index, integer, pgEnum, pgTable, primaryKey, text, timestamp, uuid } from "drizzle-orm/pg-core";

const bytes = customType<{ data: Buffer }>({ dataType: () => "bytea" });
const instant = (name: string) => timestamp(name, { withTimezone: true });

export const users = pgTable("users", {
  id: uuid().defaultRandom().primaryKey(),
  normalizedEmail: text("normalized_email").notNull().unique("users_normalized_email_unique"),
  createdAt: instant("created_at").notNull().defaultNow(),
}, (table) => [check("users_email_length", sql`length(${table.normalizedEmail}) between 3 and 254`)]);

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
  "account_created", "sign_in_succeeded", "sign_in_failed", "sign_out", "session_revoked",
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
