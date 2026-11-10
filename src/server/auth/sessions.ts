import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { and, eq, gt, isNull, lte, sql, type SQL } from "drizzle-orm";

import type { AuthDb, AuthTransaction } from "../db/auth-db";
import { authSessions, users } from "../db/schema";
import { recordAuthSecurityEvent } from "./security-events";

export const IDLE_SESSION_MS = 60 * 60 * 1000;
export const ABSOLUTE_SESSION_MS = 24 * IDLE_SESSION_MS;
export const SESSION_ACTIVITY_WRITE_INTERVAL_MS = 5 * 60 * 1000;

export type SessionPrincipal = Readonly<{ sessionId: string; userId: string }>;

export function sessionDigest(token: unknown): Buffer | null {
  if (typeof token !== "string" || !/^[A-Za-z0-9_-]{43}$/.test(token)) return null;
  const raw = Buffer.from(token, "base64url");
  if (raw.length !== 32 || raw.toString("base64url") !== token) return null;
  return createHash("sha256").update(raw).digest();
}

export function newSessionToken(now: Date) {
  const bytes = randomBytes(32);
  return {
    token: bytes.toString("base64url"),
    tokenHash: createHash("sha256").update(bytes).digest(),
    createdAt: now,
    idleExpiresAt: new Date(now.getTime() + IDLE_SESSION_MS),
    absoluteExpiresAt: new Date(now.getTime() + ABSOLUTE_SESSION_MS),
  };
}

export async function issueSession(tx: AuthTransaction, userId: string, now = new Date()): Promise<string> {
  const { token, ...record } = newSessionToken(now);
  await tx.insert(authSessions).values({ ...record, userId });
  return token;
}

function activeSession(at: Date | SQL) {
  return and(lte(authSessions.createdAt, at), isNull(authSessions.revokedAt), gt(authSessions.idleExpiresAt, at), gt(authSessions.absoluteExpiresAt, at));
}

export async function findActiveSession(db: AuthDb, token: unknown, at = new Date()): Promise<SessionPrincipal | null> {
  const digest = sessionDigest(token);
  if (!digest) return null;
  const [session] = await db.select({ sessionId: authSessions.id, userId: authSessions.userId })
    .from(authSessions).innerJoin(users, eq(users.id, authSessions.userId))
    .where(and(eq(authSessions.tokenHash, digest), activeSession(at))).limit(1);
  return session ?? null;
}

type SessionWindow = Pick<typeof authSessions.$inferSelect, "createdAt" | "idleExpiresAt" | "absoluteExpiresAt" | "revokedAt">;

export function nextIdleExpiry(session: SessionWindow, at: Date): Date | null {
  if (session.revokedAt || at < session.createdAt || at >= session.idleExpiresAt || at >= session.absoluteExpiresAt) return null;

  const currentDeadline = session.idleExpiresAt.getTime();
  const fullWindow = at.getTime() + IDLE_SESSION_MS;
  if (fullWindow - currentDeadline < SESSION_ACTIVITY_WRITE_INTERVAL_MS) return null;

  const deadline = Math.min(fullWindow, session.absoluteExpiresAt.getTime());
  return deadline > currentDeadline ? new Date(deadline) : null;
}

export async function renewSessionActivity(db: AuthDb, principal: SessionPrincipal, at?: Date): Promise<boolean> {
  const owner = and(eq(authSessions.id, principal.sessionId), eq(authSessions.userId, principal.userId));
  return db.transaction(async (tx) => {
    const [session] = await tx.select({
      createdAt: authSessions.createdAt,
      idleExpiresAt: authSessions.idleExpiresAt,
      absoluteExpiresAt: authSessions.absoluteExpiresAt,
      revokedAt: authSessions.revokedAt,
    }).from(authSessions).where(owner).for("update");
    if (!session) return false;

    // A queued request can expire while waiting for the row lock.
    const activityAt = at ?? (await tx.execute<{ at: Date }>(sql`select clock_timestamp() as "at"`)).rows[0].at;
    const deadline = nextIdleExpiry(session, activityAt);
    if (!deadline) return false;

    const [renewed] = await tx.update(authSessions).set({ idleExpiresAt: deadline })
      .where(and(owner, activeSession(at ?? sql`statement_timestamp()`)))
      .returning({ id: authSessions.id });
    return Boolean(renewed);
  });
}

export async function replacePresentedSession(tx: AuthTransaction, previous: unknown, now: Date): Promise<void> {
  const digest = sessionDigest(previous);
  if (!digest) return;
  const [revoked] = await tx.update(authSessions).set({ revokedAt: sql`greatest(${authSessions.createdAt}, ${now.toISOString()}::timestamptz)` })
    .where(and(eq(authSessions.tokenHash, digest), activeSession(now))).returning({ userId: authSessions.userId });
  if (revoked) await recordAuthSecurityEvent(tx, { type: "session_revoked", userId: revoked.userId });
}

export async function revokeCurrentSession(db: AuthDb, principal: SessionPrincipal, now = new Date()): Promise<void> {
  await db.transaction(async (tx) => {
    const [revoked] = await tx.update(authSessions).set({ revokedAt: sql`greatest(${authSessions.createdAt}, ${now.toISOString()}::timestamptz)` })
      .where(and(eq(authSessions.id, principal.sessionId), eq(authSessions.userId, principal.userId), activeSession(now)))
      .returning({ userId: authSessions.userId });
    if (revoked) await recordAuthSecurityEvent(tx, { type: "sign_out", userId: revoked.userId });
  });
}

/** Internal lifecycle primitive. Call within the same transaction as the future credential/account change. */
export async function revokeAllUserSessions(tx: AuthTransaction, userId: string): Promise<void> {
  const [user] = await tx.select({ id: users.id }).from(users).where(eq(users.id, userId)).for("update");
  if (!user) return;
  const revoked = await tx.update(authSessions).set({ revokedAt: sql`greatest(${authSessions.createdAt}, clock_timestamp())` })
    .where(and(eq(authSessions.userId, userId), isNull(authSessions.revokedAt))).returning({ id: authSessions.id });
  if (revoked.length) await recordAuthSecurityEvent(tx, { type: "session_revoked", userId });
}
