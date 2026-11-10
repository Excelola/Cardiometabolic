import { randomUUID } from "node:crypto";
import { mkdtemp, rmdir, unlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { hash } from "@node-rs/argon2";
import { eq, isNull, sql } from "drizzle-orm";
import { describe, expect, it } from "vitest";

import type { AuthDb } from "../db/auth-db";
import { adminUrl, applyMigrations, disposable, runPgTool } from "../db/disposable-postgres";
import { authSecurityEvents, authSessions, passwordCredentials, users } from "../db/schema";
import { readAuthConfig } from "./config";
import { authenticateAccount, createAccount } from "./credentials";
import { normalizeEmail } from "./input";
import { ARGON2_OPTIONS } from "./password";
import { findActiveSession, renewSessionActivity, revokeAllUserSessions, revokeCurrentSession, sessionDigest } from "./sessions";
import { reserveAuthAdmission } from "./throttle";

const config = readAuthConfig({ NODE_ENV: "test", HILERA_AUTH_CSRF_SECRET: Buffer.alloc(32, 1).toString("base64url"),
  HILERA_AUTH_THROTTLE_SECRET: Buffer.alloc(32, 2).toString("base64url") });
const password = "Synthetïc integration passphrase 731 🪴";

function token(outcome: Awaited<ReturnType<typeof createAccount>>): string {
  if (outcome.kind !== "success") throw new Error(`Expected successful synthetic authentication, got ${outcome.kind}.`);
  return outcome.token;
}

describe.skipIf(!adminUrl)("disposable PostgreSQL authentication integration", () => {
  it("migrates an empty database, handles duplicate races, upgrades credentials, isolates users and revokes sessions", async () => {
    await disposable(async (db) => {
      await applyMigrations(db);
      const email = normalizeEmail("person@EXAMPLE.TEST")!;
      const parallel = await Promise.all([
        createAccount(db, config, { email, password }),
        createAccount(db, config, { email: normalizeEmail("person@example.test")!, password }),
      ]);
      expect(parallel.map((result) => result.kind).sort()).toEqual(["registration_failed", "success"]);
      expect(await db.$count(users)).toBe(1);
      expect(await db.$count(passwordCredentials)).toBe(1);
      expect(await db.$count(authSessions)).toBe(1);

      const first = token(parallel.find((result) => result.kind === "success")!);
      const owner = (await findActiveSession(db, first))!;
      const [savedSession] = await db.select().from(authSessions).where(eq(authSessions.id, owner.sessionId));
      expect(savedSession.tokenHash.equals(sessionDigest(first)!)).toBe(true);

      const tooSoon = new Date(savedSession.createdAt.getTime() + 4 * 60 * 1000);
      expect(await renewSessionActivity(db, owner, tooSoon)).toBe(false);
      const [unchangedSession] = await db.select().from(authSessions).where(eq(authSessions.id, owner.sessionId));
      expect(unchangedSession.idleExpiresAt).toEqual(savedSession.idleExpiresAt);

      const activeAtTenMinutes = new Date(savedSession.createdAt.getTime() + 10 * 60 * 1000);
      expect(await findActiveSession(db, first, activeAtTenMinutes)).toEqual(owner);
      const [afterPassiveRead] = await db.select().from(authSessions).where(eq(authSessions.id, owner.sessionId));
      expect(afterPassiveRead.idleExpiresAt).toEqual(savedSession.idleExpiresAt);

      const concurrentRenewals = await Promise.all([
        renewSessionActivity(db, owner, activeAtTenMinutes),
        renewSessionActivity(db, owner, activeAtTenMinutes),
      ]);
      expect(concurrentRenewals.filter(Boolean)).toHaveLength(1);

      const [renewedSession] = await db.select().from(authSessions).where(eq(authSessions.id, owner.sessionId));
      expect(renewedSession.idleExpiresAt.toISOString()).toBe(
        new Date(activeAtTenMinutes.getTime() + 60 * 60 * 1000).toISOString(),
      );
      expect(await findActiveSession(db, first, savedSession.idleExpiresAt)).toEqual(owner);
      expect(await findActiveSession(db, first, renewedSession.idleExpiresAt)).toBeNull();
      expect(await renewSessionActivity(db, owner, renewedSession.idleExpiresAt)).toBe(false);

      const nearAbsolute = new Date(savedSession.absoluteExpiresAt.getTime() - 30 * 60 * 1000);
      const priorIdleDeadline = new Date(savedSession.absoluteExpiresAt.getTime() - 10 * 60 * 1000);
      await db.update(authSessions).set({ idleExpiresAt: priorIdleDeadline }).where(eq(authSessions.id, owner.sessionId));
      expect(await renewSessionActivity(db, owner, nearAbsolute)).toBe(true);
      const [cappedSession] = await db.select().from(authSessions).where(eq(authSessions.id, owner.sessionId));
      expect(cappedSession.idleExpiresAt).toEqual(savedSession.absoluteExpiresAt);
      expect(cappedSession.absoluteExpiresAt).toEqual(savedSession.absoluteExpiresAt);
      expect(await findActiveSession(db, first, savedSession.absoluteExpiresAt)).toBeNull();
      expect(await renewSessionActivity(db, owner, savedSession.absoluteExpiresAt)).toBe(false);
      expect(await findActiveSession(db, first, new Date(savedSession.absoluteExpiresAt.getTime() - 1))).toEqual(owner);

      const wrong = await authenticateAccount(db, config, { email, password: "incorrect synthetic passphrase" });
      const missing = await authenticateAccount(db, config, { email: "absent@example.test", password });
      expect(wrong.kind).toBe("invalid_credentials");
      expect(missing.kind).toBe(wrong.kind);

      const weaker = await hash(password, { ...ARGON2_OPTIONS, memoryCost: 12288 });
      const [before] = await db.select().from(passwordCredentials).where(eq(passwordCredentials.userId, owner.userId));
      await db.update(passwordCredentials).set({ passwordHash: weaker }).where(eq(passwordCredentials.userId, owner.userId));
      const second = token(await authenticateAccount(db, config, { email, password }));
      const [after] = await db.select().from(passwordCredentials).where(eq(passwordCredentials.userId, owner.userId));
      expect(after.passwordHash.startsWith("$argon2id$v=19$m=19456,t=2,p=1$") && after.passwordHash !== password).toBe(true);
      expect(after.passwordChangedAt).toEqual(before.passwordChangedAt);
      expect(second !== first).toBe(true);
      expect(await findActiveSession(db, first)).toEqual(owner);

      const otherToken = token(await createAccount(db, config, { email: "another@example.test", password }));
      const other = (await findActiveSession(db, otherToken))!;
      expect(other.userId !== owner.userId).toBe(true);
      expect(await renewSessionActivity(db, { sessionId: owner.sessionId, userId: other.userId }, nearAbsolute)).toBe(false);
      await revokeCurrentSession(db, { sessionId: owner.sessionId, userId: other.userId });
      expect(await findActiveSession(db, first)).toEqual(owner);
      const rotated = token(await authenticateAccount(db, config, { email, password, previousToken: second }));
      expect(await findActiveSession(db, second)).toBeNull();
      const rotatedPrincipal = (await findActiveSession(db, rotated))!;
      const [beforeLiveRenewal] = await db.update(authSessions)
        .set({ idleExpiresAt: sql`clock_timestamp() + interval '30 minutes'` })
        .where(eq(authSessions.id, rotatedPrincipal.sessionId)).returning();
      expect(await renewSessionActivity(db, rotatedPrincipal)).toBe(true);
      const [afterLiveRenewal] = await db.select().from(authSessions).where(eq(authSessions.id, rotatedPrincipal.sessionId));
      expect(afterLiveRenewal.idleExpiresAt.getTime()).toBeGreaterThan(beforeLiveRenewal.idleExpiresAt.getTime());
      expect(afterLiveRenewal.absoluteExpiresAt).toEqual(beforeLiveRenewal.absoluteExpiresAt);
      await revokeCurrentSession(db, owner);
      await revokeCurrentSession(db, owner);
      expect(await findActiveSession(db, first)).toBeNull();
      expect(await renewSessionActivity(db, owner, nearAbsolute)).toBe(false);
      expect(await findActiveSession(db, rotated)).not.toBeNull();
      await db.transaction((tx) => revokeAllUserSessions(tx, owner.userId));
      expect(await findActiveSession(db, rotated)).toBeNull();
      expect(await findActiveSession(db, otherToken)).toEqual(other);

      const events = await db.select().from(authSecurityEvents);
      const allowed = ["id", "userId", "eventType", "occurredAt"].sort();
      expect(events.every((event) => Object.keys(event).sort().join() === allowed.join())).toBe(true);
      expect(events.filter((event) => event.eventType === "sign_in_failed").every((event) => event.userId === null)).toBe(true);
      expect(JSON.stringify(events).includes(password)).toBe(false);
    });
  }, 35_000);

  it("reserves shared concurrent budgets, recovers after cooldown and fails closed on storage error", async () => {
    await disposable(async (db) => {
      await applyMigrations(db);
      const now = new Date("2026-11-10T00:00:00Z");
      const fleet = { ...config, throttle: { ...config.throttle, globalLimit: 4, identityLimit: 1 } };
      const results = await Promise.all(Array.from({ length: 12 }, (_, index) => reserveAuthAdmission(db, fleet, `test${index}@example.test`, now)));
      expect(results.filter((result) => result === "admitted")).toHaveLength(4);
      expect(results.filter((result) => result === "throttled")).toHaveLength(8);
      const later = new Date(now.getTime() + fleet.throttle.globalWindowMs);
      expect(await reserveAuthAdmission(db, fleet, "cooldown@example.test", later)).toBe("admitted");
      expect(await reserveAuthAdmission(db, fleet, "cooldown@example.test", later)).toBe("admitted");
      expect(await reserveAuthAdmission(db, fleet, "cooldown@example.test", later)).toBe("throttled");
      expect(await reserveAuthAdmission(db, fleet, "cooldown@example.test", new Date(later.getTime() + 1000))).toBe("admitted");
      const broken = { transaction: () => Promise.reject(new Error("synthetic storage outage")) } as unknown as AuthDb;
      expect(await reserveAuthAdmission(broken, fleet, "test@example.test", now)).toBe("unavailable");
    });
  }, 35_000);

  it("dumps a migrated source, destroys it, restores to a new database and invalidates restored sessions", async () => {
    const directory = await mkdtemp(join(tmpdir(), "hilera-auth-backup-"));
    const backup = join(directory, "synthetic.dump");
    let backedUpBearer = "";
    try {
      await disposable(async (db, name, url) => {
        await applyMigrations(db);
        backedUpBearer = token(await createAccount(db, config, { email: "restore@example.test", password }));
        runPgTool("pg_dump", ["--format=custom", "--no-owner", "--no-privileges", "--file", backup], name, url);
      }); // Source is dropped before the restore database is created.

      await disposable(async (db, name, url) => {
        runPgTool("pg_restore", ["--exit-on-error", "--no-owner", "--no-privileges", backup], name, url);
        expect(await db.$count(users)).toBe(1);
        expect(await db.$count(passwordCredentials)).toBe(1);
        expect(await db.$count(authSessions)).toBe(1);
        await expect(db.insert(users).values({ normalizedEmail: "restore@example.test" })).rejects.toThrow();
        await expect(db.insert(passwordCredentials).values({ userId: randomUUID(), passwordHash: "$argon2id$synthetic" })).rejects.toThrow();

        // A restored database can resurrect a bearer that was valid at the backup point.
        expect(await findActiveSession(db, backedUpBearer)).not.toBeNull();

        // Recovery must invalidate restored active sessions before user traffic resumes.
        await db.update(authSessions)
          .set({ revokedAt: sql`greatest(${authSessions.createdAt}, clock_timestamp())` })
          .where(isNull(authSessions.revokedAt));
        expect(await findActiveSession(db, backedUpBearer)).toBeNull();

        expect((await authenticateAccount(db, config, { email: "restore@example.test", password })).kind).toBe("success");
      });
    } finally {
      await unlink(backup).catch((error: NodeJS.ErrnoException) => { if (error.code !== "ENOENT") throw error; });
      await rmdir(directory);
    }
  }, 70_000);
});
