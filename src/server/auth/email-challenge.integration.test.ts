import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { eq, sql } from "drizzle-orm";
import { describe, expect, it } from "vitest";

import { adminUrl, applyMigrations, disposable } from "@/server/db/disposable-postgres";
import { healthRecords } from "@/server/db/health-schema";
import { healthDocumentCandidates, healthDocumentUploads } from "@/server/db/document-schema";
import { authEmailChallenges, passwordCredentials, users } from "@/server/db/schema";
import { correctHealthRecord, createHealthRecord } from "@/server/health/repository";
import { FakeOcrProvider, FakeScanner } from "@/server/documents/providers";
import { confirmDocumentUpload, getOwnedReview, processDocumentUpload } from "@/server/documents/service";
import { readAuthConfig } from "./config";
import { authenticateAccount, createAccount } from "./credentials";
import type { EmailDelivery } from "./email-delivery";
import { requestEmailChallenge, resetPasswordWithEmailCode, verifyRegisteredEmail } from "./email-challenge-service";
import { generateEmailCode } from "./email-challenge-code";
import { hashPassword } from "./password";
import { findActiveSession } from "./sessions";

const auth = readAuthConfig({ NODE_ENV: "test", HILERA_AUTH_CSRF_SECRET: Buffer.alloc(32, 1).toString("base64url"),
  HILERA_AUTH_THROTTLE_SECRET: Buffer.alloc(32, 2).toString("base64url") });
const password = "Synthetic account password example 925!";
const replacement = "Another synthetic account password 928!";
const health = { type: "weight", value: "73", unit: "kg", occurredAt: "2026-01-01T00:00:00.000Z" } as const;

describe.skipIf(!adminUrl)("verified email and recovery on disposable PostgreSQL", () => {
  it("protects new health writes and legacy ownership, consumes recovery exactly once, and revokes sessions", async () => {
    await disposable(async (db) => {
      await applyMigrations(db);
      const messages: Array<{ email: string; purpose: string; code: string }> = [];
      const sender: EmailDelivery = { async send(message) { messages.push(message); } };
      const config = { codeSecret: Buffer.alloc(32, 3), throttleSecret: auth.throttleSecret, sender };
      const email = `Case-${randomUUID()}@example.test`;
      const account = await createAccount(db, auth, { email, password });
      if (account.kind !== "success") throw new Error("Synthetic signup failed");
      const principal = await findActiveSession(db, account.token);
      if (!principal) throw new Error("Synthetic session failed");
      const secondSession = await authenticateAccount(db, auth, { email, password });
      if (secondSession.kind !== "success") throw new Error("Second synthetic session failed");
      await expect(createHealthRecord(db, principal.userId, health)).rejects.toThrow("Email verification is required");
      const png = readFileSync(new URL("../documents/fixtures/synthetic.png", import.meta.url));
      const file = new File([new Uint8Array(png)], "synthetic.png", { type: "image/png" });
      const scanner = new FakeScanner("clean");
      const ocr = new FakeOcrProvider([{ number: 1, text: "Weight: 71 kg" }]);
      await expect(processDocumentUpload(db, principal.userId, file, scanner, ocr)).rejects.toThrow("Email verification is required");
      expect(await db.$count(healthDocumentUploads)).toBe(0);
      await requestEmailChallenge(db, config, "verify_email", { userId: principal.userId });
      const verification = messages.shift();
      expect(verification?.purpose).toBe("verify_email");
      expect(await verifyRegisteredEmail(db, config, principal.userId, verification!.code)).toBe(true);
      expect(await verifyRegisteredEmail(db, config, principal.userId, verification!.code)).toBe(false);
      const recordId = await createHealthRecord(db, principal.userId, health);
      expect(await db.$count(healthRecords)).toBe(1);
      const upload = await processDocumentUpload(db, principal.userId, file, scanner, ocr);
      if (!("id" in upload)) throw new Error("Synthetic upload failed");
      const review = await getOwnedReview(db, principal.userId, upload.id);
      const candidate = review!.candidates[0];
      const form = new FormData();
      form.set(`${candidate.id}:selection`, "include");
      form.set(`${candidate.id}:value`, "71");
      form.set(`${candidate.id}:unit`, "kg");
      form.set(`${candidate.id}:occurredAt`, "2026-01-01T00:00:00.000Z");
      await db.update(users).set({ emailVerifiedAt: null }).where(eq(users.id, principal.userId));
      await expect(correctHealthRecord(db, principal.userId, recordId, health)).rejects.toThrow("Email verification is required");
      await expect(confirmDocumentUpload(db, principal.userId, upload.id, form)).rejects.toThrow("Email verification is required");
      expect(await db.$count(healthDocumentCandidates)).toBe(1);
      expect(await db.$count(healthRecords)).toBe(1);
      await db.update(users).set({ emailVerifiedAt: new Date() }).where(eq(users.id, principal.userId));

      await requestEmailChallenge(db, config, "reset_password", { email });
      const recovery = messages.shift();
      expect(recovery?.purpose).toBe("reset_password");
      const simultaneous = await Promise.all([
        resetPasswordWithEmailCode(db, config, email, recovery!.code, replacement),
        resetPasswordWithEmailCode(db, config, email, recovery!.code, replacement),
      ]);
      expect(simultaneous.sort()).toEqual([false, true]);
      expect(await findActiveSession(db, account.token)).toBeNull();
      expect(await findActiveSession(db, secondSession.token)).toBeNull();
      expect((await authenticateAccount(db, auth, { email, password })).kind).toBe("invalid_credentials");
      expect((await authenticateAccount(db, auth, { email, password: replacement })).kind).toBe("success");
      expect(await db.$count(healthRecords)).toBe(1);

      const [{ id: legacy }] = await db.insert(users).values({ normalizedEmail: `legacy-${randomUUID()}@example.test`,
        legacyRecoveryRestricted: true, emailVerifiedAt: new Date() }).returning({ id: users.id });
      const [legacyUser] = await db.select().from(users).where(eq(users.id, legacy));
      await requestEmailChallenge(db, config, "reset_password", { email: legacyUser.normalizedEmail });
      expect(messages).toHaveLength(0);
      expect(await db.$count(authEmailChallenges, eq(authEmailChallenges.userId, legacy))).toBe(0);
    });
  }, 60000);

  it("rejects stale, wrong-purpose, foreign and exhausted codes and fails closed without delivery", async () => {
    await disposable(async (db) => {
      await applyMigrations(db);
      const messages: Array<{ email: string; purpose: string; code: string }> = [];
      const sender: EmailDelivery = { async send(message) { messages.push(message); } };
      const config = { codeSecret: Buffer.alloc(32, 4), throttleSecret: auth.throttleSecret, sender };
      async function makeAccount() {
        const email = `synthetic-${randomUUID()}@example.test`;
        const result = await createAccount(db, auth, { email, password });
        if (result.kind !== "success") throw new Error("Synthetic signup failed");
        const principal = await findActiveSession(db, result.token);
        if (!principal) throw new Error("Synthetic session missing");
        return { email, userId: principal.userId };
      }
      const a = await makeAccount();
      const b = await makeAccount();
      await requestEmailChallenge(db, { ...config, sender: null }, "verify_email", { userId: a.userId });
      expect(await db.$count(authEmailChallenges)).toBe(0);
      await requestEmailChallenge(db, config, "verify_email", { userId: a.userId });
      const first = messages.shift()!.code;
      await requestEmailChallenge(db, config, "verify_email", { userId: a.userId });
      const second = messages.shift()!.code;
      expect(await verifyRegisteredEmail(db, config, a.userId, first)).toBe(false);
      expect(await verifyRegisteredEmail(db, config, b.userId, second)).toBe(false);
      expect(await resetPasswordWithEmailCode(db, config, a.email, second, replacement)).toBe(false);
      expect(await verifyRegisteredEmail(db, config, a.userId, second)).toBe(true);
      await requestEmailChallenge(db, config, "verify_email", { userId: b.userId });
      const bCode = messages.shift()!.code;
      for (let i = 0; i < 4; i++) expect(await verifyRegisteredEmail(db, config, b.userId, generateEmailCode())).toBe(false);
      expect(await verifyRegisteredEmail(db, config, b.userId, bCode)).toBe(false);
      const [bUser] = await db.select().from(users).where(eq(users.id, b.userId));
      expect(bUser.emailVerifiedAt).toBeNull();
      const expired = await makeAccount();
      await requestEmailChallenge(db, config, "verify_email", { userId: expired.userId });
      const expiredCode = messages.shift()!.code;
      await db.update(authEmailChallenges).set({ createdAt: new Date(Date.now() - 120_000), activatedAt: new Date(Date.now() - 90_000), expiresAt: new Date(Date.now() - 60_000) })
        .where(eq(authEmailChallenges.userId, expired.userId));
      expect(await verifyRegisteredEmail(db, config, expired.userId, expiredCode)).toBe(false);
    });
  }, 60000);

  it("rolls back a partial reset and prevents an old-password sign-in from surviving a concurrent reset", async () => {
    await disposable(async (db) => {
      await applyMigrations(db);
      const messages: Array<{ email: string; purpose: string; code: string }> = [];
      const sender: EmailDelivery = { async send(message) { messages.push(message); } };
      const config = { codeSecret: Buffer.alloc(32, 5), throttleSecret: auth.throttleSecret, sender };
      const email = `synthetic-race-${randomUUID()}@example.test`;
      const account = await createAccount(db, auth, { email, password });
      if (account.kind !== "success") throw new Error("Synthetic signup failed");
      const principal = await findActiveSession(db, account.token);
      if (!principal) throw new Error("Synthetic session missing");
      await requestEmailChallenge(db, config, "verify_email", { userId: principal.userId });
      expect(await verifyRegisteredEmail(db, config, principal.userId, messages.shift()!.code)).toBe(true);
      await requestEmailChallenge(db, config, "reset_password", { email });
      const code = messages.shift()!.code;
      await db.execute(sql`create function test_fail_reset_event() returns trigger language plpgsql as $$ begin if NEW.event_type::text = 'password_reset_completed' then raise exception 'synthetic failure'; end if; return NEW; end $$`);
      await db.execute(sql`create trigger test_fail_reset_event before insert on auth_security_events for each row execute function test_fail_reset_event()`);
      await expect(resetPasswordWithEmailCode(db, config, email, code, replacement)).rejects.toThrow();
      expect(await findActiveSession(db, account.token)).not.toBeNull();
      expect((await authenticateAccount(db, auth, { email, password })).kind).toBe("success");
      await db.execute(sql`drop trigger test_fail_reset_event on auth_security_events`);
      const [reset, racedSignIn] = await Promise.all([
        resetPasswordWithEmailCode(db, config, email, code, replacement),
        authenticateAccount(db, auth, { email, password }),
      ]);
      expect(reset).toBe(true);
      expect(await findActiveSession(db, account.token)).toBeNull();
      if (racedSignIn.kind === "success") expect(await findActiveSession(db, racedSignIn.token)).toBeNull();
      expect((await authenticateAccount(db, auth, { email, password })).kind).toBe("invalid_credentials");
    });
  }, 60000);

  it("separates recovery request throttling from sign-in and consumes a failed delivery", async () => {
    await disposable(async (db) => {
      await applyMigrations(db);
      const email = `synthetic-throttle-${randomUUID()}@example.test`;
      const account = await createAccount(db, auth, { email, password });
      if (account.kind !== "success") throw new Error("Synthetic signup failed");
      const principal = await findActiveSession(db, account.token);
      if (!principal) throw new Error("Synthetic session missing");
      await db.update(users).set({ emailVerifiedAt: new Date() }).where(eq(users.id, principal.userId));
      let sends = 0;
      const sender: EmailDelivery = { async send() { sends++; throw new Error("synthetic delivery failure"); } };
      const config = { codeSecret: Buffer.alloc(32, 6), throttleSecret: auth.throttleSecret, sender };
      for (let index = 0; index < 7; index++) await requestEmailChallenge(db, config, "reset_password", { email });
      expect(sends).toBe(5);
      const challenges = await db.select().from(authEmailChallenges).where(eq(authEmailChallenges.userId, principal.userId));
      expect(challenges).toHaveLength(5);
      expect(challenges.every((challenge) => challenge.consumedAt !== null)).toBe(true);
      expect(challenges.every((challenge) => challenge.activatedAt === null)).toBe(true);
      expect((await authenticateAccount(db, auth, { email, password })).kind).toBe("success");
    });
  }, 60000);

  it("does not accept a code until delivery completes and activation is committed", async () => {
    await disposable(async (db) => {
      await applyMigrations(db);
      const email = `synthetic-delivery-${randomUUID()}@example.test`;
      const account = await createAccount(db, auth, { email, password });
      if (account.kind !== "success") throw new Error("Synthetic signup failed");
      const principal = await findActiveSession(db, account.token);
      if (!principal) throw new Error("Synthetic session missing");
      let release!: () => void;
      let received!: (code: string) => void;
      const delivered = new Promise<string>((resolve) => { received = resolve; });
      const hold = new Promise<void>((resolve) => { release = resolve; });
      const sender: EmailDelivery = { async send(message) { received(message.code); await hold; } };
      const config = { codeSecret: Buffer.alloc(32, 7), throttleSecret: auth.throttleSecret, sender };
      const request = requestEmailChallenge(db, config, "verify_email", { userId: principal.userId });
      try {
        const code = await delivered;
        expect(await verifyRegisteredEmail(db, config, principal.userId, code)).toBe(false);
        release();
        await request;
        expect(await verifyRegisteredEmail(db, config, principal.userId, code)).toBe(true);
      } finally {
        release();
        await request;
      }
    });
  }, 60000);

  it("does not allow a recovery code to reset another user's credentials", async () => {
    await disposable(async (db) => {
      await applyMigrations(db);
      const messages: Array<{ email: string; purpose: string; code: string }> = [];
      const sender: EmailDelivery = { async send(message) { messages.push(message); } };
      const config = { codeSecret: Buffer.alloc(32, 8), throttleSecret: auth.throttleSecret, sender };
      const first = `synthetic-first-${randomUUID()}@example.test`;
      const second = `synthetic-second-${randomUUID()}@example.test`;
      for (const email of [first, second]) {
        const account = await createAccount(db, auth, { email, password });
        if (account.kind !== "success") throw new Error("Synthetic signup failed");
        const principal = await findActiveSession(db, account.token);
        if (!principal) throw new Error("Synthetic session missing");
        await db.update(users).set({ emailVerifiedAt: new Date() }).where(eq(users.id, principal.userId));
      }
      await requestEmailChallenge(db, config, "reset_password", { email: first });
      const code = messages.shift()!.code;
      expect(await resetPasswordWithEmailCode(db, config, second, code, replacement)).toBe(false);
      expect((await authenticateAccount(db, auth, { email: second, password })).kind).toBe("success");
      expect(await resetPasswordWithEmailCode(db, config, first, code, replacement)).toBe(true);
      expect((await authenticateAccount(db, auth, { email: second, password })).kind).toBe("success");
    });
  }, 60000);

  it("rejects a recovery code after the bound credential has changed", async () => {
    await disposable(async (db) => {
      await applyMigrations(db);
      const messages: Array<{ email: string; purpose: string; code: string }> = [];
      const sender: EmailDelivery = { async send(message) { messages.push(message); } };
      const config = { codeSecret: Buffer.alloc(32, 9), throttleSecret: auth.throttleSecret, sender };
      const email = `synthetic-version-${randomUUID()}@example.test`;
      const account = await createAccount(db, auth, { email, password });
      if (account.kind !== "success") throw new Error("Synthetic signup failed");
      const principal = await findActiveSession(db, account.token);
      if (!principal) throw new Error("Synthetic session missing");
      await db.update(users).set({ emailVerifiedAt: new Date() }).where(eq(users.id, principal.userId));
      await requestEmailChallenge(db, config, "reset_password", { email });
      const code = messages.shift()!.code;
      await db.update(passwordCredentials).set({ passwordHash: await hashPassword(replacement), passwordChangedAt: new Date() })
        .where(eq(passwordCredentials.userId, principal.userId));
      expect(await resetPasswordWithEmailCode(db, config, email, code, password)).toBe(false);
      expect((await authenticateAccount(db, auth, { email, password: replacement })).kind).toBe("success");
    });
  }, 60000);
});
