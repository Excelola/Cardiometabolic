import "server-only";

import { and, desc, eq, gt, isNull, lte, sql } from "drizzle-orm";

import type { AuthDb, AuthTransaction } from "@/server/db/auth-db";
import { authEmailChallenges, passwordCredentials, users } from "@/server/db/schema";
import { EMAIL_CODE_LIFETIME_MS, EMAIL_CODE_MAX_ATTEMPTS, emailCodeDigest, generateEmailCode, matchesEmailCode, type EmailChallengePurpose } from "./email-challenge-code";
import type { EmailDelivery } from "./email-delivery";
import { normalizeEmail } from "./input";
import { hashPassword, validateNewPassword } from "./password";
import { reserveRecoveryAdmission } from "./recovery-admission";
import { recordAuthSecurityEvent } from "./security-events";
import { revokeAllUserSessions } from "./sessions";

type ChallengeConfig = Readonly<{ codeSecret: Uint8Array; throttleSecret: Uint8Array; sender: EmailDelivery | null }>;

export function readChallengeSecret(value: string | undefined): Buffer | null {
  if (!value || !/^[A-Za-z0-9_-]{43}$/.test(value)) return null;
  const decoded = Buffer.from(value, "base64url");
  return decoded.length === 32 && decoded.toString("base64url") === value ? decoded : null;
}

async function invalidatePending(tx: AuthTransaction, userId: string, purpose: EmailChallengePurpose) {
  await tx.update(authEmailChallenges).set({ consumedAt: sql`greatest(${authEmailChallenges.createdAt}, clock_timestamp())` })
    .where(and(eq(authEmailChallenges.userId, userId), eq(authEmailChallenges.purpose, purpose), isNull(authEmailChallenges.consumedAt)));
}

export async function requestEmailChallenge(db: AuthDb, config: ChallengeConfig, purpose: EmailChallengePurpose,
  identity: { userId: string } | { email: string }): Promise<void> {
  const normalized = "email" in identity ? normalizeEmail(identity.email) : null;
  if ("email" in identity && !normalized) return;
  const admissionIdentity = normalized ?? ("userId" in identity ? identity.userId : "invalid");
  if (!await reserveRecoveryAdmission(db, config.throttleSecret, purpose === "verify_email" ? "verify_request" : "recovery_request", admissionIdentity)) return;
  if (!config.sender) return;
  const code = generateEmailCode();
  const challenge = await db.transaction(async (tx) => {
    const [user] = await tx.select().from(users).where("userId" in identity ? eq(users.id, identity.userId) : eq(users.normalizedEmail, normalized!)).for("update");
    if (!user || (purpose === "verify_email" && user.emailVerifiedAt)
      || (purpose === "reset_password" && (!user.emailVerifiedAt || user.legacyRecoveryRestricted))) return null;
    const credential = purpose === "reset_password"
      ? (await tx.select({ hash: passwordCredentials.passwordHash }).from(passwordCredentials).where(eq(passwordCredentials.userId, user.id)).for("update"))[0]
      : undefined;
    if (purpose === "reset_password" && !credential) return null;
    const digest = emailCodeDigest(config.codeSecret, purpose, user.id, user.normalizedEmail, code, credential?.hash);
    if (!digest) return null;
    await invalidatePending(tx, user.id, purpose);
    const [created] = await tx.insert(authEmailChallenges).values({ userId: user.id, purpose, digest,
      expiresAt: sql`now() + ${EMAIL_CODE_LIFETIME_MS} * interval '1 millisecond'` }).returning({ id: authEmailChallenges.id });
    return { id: created.id, userId: user.id, email: user.normalizedEmail };
  });
  if (!challenge) return;
  try {
    await config.sender.send({ email: challenge.email, purpose, code });
    await db.update(authEmailChallenges).set({ activatedAt: sql`clock_timestamp()` })
      .where(and(eq(authEmailChallenges.id, challenge.id), eq(authEmailChallenges.userId, challenge.userId),
        isNull(authEmailChallenges.consumedAt), isNull(authEmailChallenges.activatedAt), gt(authEmailChallenges.expiresAt, sql`clock_timestamp()`)));
  } catch {
    await db.update(authEmailChallenges).set({ consumedAt: sql`greatest(${authEmailChallenges.createdAt}, clock_timestamp())` })
      .where(and(eq(authEmailChallenges.id, challenge.id), eq(authEmailChallenges.userId, challenge.userId), isNull(authEmailChallenges.consumedAt)));
  }
}

async function checkedChallenge(tx: AuthTransaction, config: ChallengeConfig, user: typeof users.$inferSelect,
  purpose: EmailChallengePurpose, code: string, credentialHash?: string): Promise<boolean> {
  const [challenge] = await tx.select().from(authEmailChallenges).where(and(eq(authEmailChallenges.userId, user.id),
    eq(authEmailChallenges.purpose, purpose), isNull(authEmailChallenges.consumedAt)))
    .orderBy(desc(authEmailChallenges.createdAt)).limit(1).for("update");
  if (!challenge || !challenge.activatedAt) return false;
  const [time] = await tx.execute<{ epoch_ms: number }>(sql`
    select (extract(epoch from clock_timestamp()) * 1000)::double precision as epoch_ms
  `).then((result) => result.rows);
  if (challenge.expiresAt.getTime() <= time.epoch_ms || challenge.failedAttempts >= EMAIL_CODE_MAX_ATTEMPTS) return false;
  const digest = emailCodeDigest(config.codeSecret, purpose, user.id, user.normalizedEmail, code, credentialHash);
  if (!matchesEmailCode(challenge.digest, digest)) {
    await tx.update(authEmailChallenges).set({ failedAttempts: challenge.failedAttempts + 1 }).where(eq(authEmailChallenges.id, challenge.id));
    return false;
  }
  await invalidatePending(tx, user.id, purpose);
  return true;
}

export async function verifyRegisteredEmail(db: AuthDb, config: ChallengeConfig, userId: string, code: string): Promise<boolean> {
  if (!config.sender || !await reserveRecoveryAdmission(db, config.throttleSecret, "verify_attempt", userId)) return false;
  return db.transaction(async (tx) => {
    const [user] = await tx.select().from(users).where(eq(users.id, userId)).for("update");
    if (!user || user.emailVerifiedAt || !await checkedChallenge(tx, config, user, "verify_email", code)) return false;
    await tx.update(users).set({ emailVerifiedAt: sql`clock_timestamp()` }).where(eq(users.id, userId));
    await recordAuthSecurityEvent(tx, { type: "email_verified", userId });
    return true;
  });
}

export async function resetPasswordWithEmailCode(db: AuthDb, config: ChallengeConfig, email: string, code: string, password: string): Promise<boolean> {
  const normalized = normalizeEmail(email);
  if (!normalized || !config.sender || validateNewPassword(password) !== "valid") return false;
  if (!await reserveRecoveryAdmission(db, config.throttleSecret, "recovery_attempt", normalized)) return false;
  const replacement = await hashPassword(password);
  return db.transaction(async (tx) => {
    const [user] = await tx.select().from(users).where(eq(users.normalizedEmail, normalized)).for("update");
    if (!user || !user.emailVerifiedAt || user.legacyRecoveryRestricted) return false;
    const [credential] = await tx.select().from(passwordCredentials).where(eq(passwordCredentials.userId, user.id)).for("update");
    if (!credential || !await checkedChallenge(tx, config, user, "reset_password", code, credential.passwordHash)) return false;
    await tx.update(passwordCredentials).set({ passwordHash: replacement, passwordChangedAt: sql`clock_timestamp()` }).where(eq(passwordCredentials.userId, user.id));
    await revokeAllUserSessions(tx, user.id);
    await recordAuthSecurityEvent(tx, { type: "password_reset_completed", userId: user.id });
    return true;
  });
}

/** Idempotent cleanup for a future approved scheduler. */
export async function cleanupExpiredEmailChallenges(db: AuthDb): Promise<number> {
  const removed = await db.delete(authEmailChallenges).where(lte(authEmailChallenges.expiresAt, new Date()))
    .returning({ id: authEmailChallenges.id });
  return removed.length;
}
