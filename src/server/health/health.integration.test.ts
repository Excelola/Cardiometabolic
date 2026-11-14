import { randomUUID } from "node:crypto";
import { copyFile, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { eq, isNull, sql } from "drizzle-orm";
import { describe, expect, it } from "vitest";

import type { HealthEntry } from "@/domain/health-records";
import { readAuthConfig } from "@/server/auth/config";
import { authenticateAccount, createAccount } from "@/server/auth/credentials";
import { hashPassword } from "@/server/auth/password";
import { findActiveSession, issueSession } from "@/server/auth/sessions";
import type { AuthDb } from "@/server/db/auth-db";
import { adminUrl, applyMigrations, disposable, runPgTool } from "@/server/db/disposable-postgres";
import { healthRecords, lipidPanelRecords, weightRecords } from "@/server/db/health-schema";
import { authSessions, users } from "@/server/db/schema";

import { correctHealthRecord, createHealthRecord, getCurrentHealthRecord, listHealthHistory } from "./repository";

const config = readAuthConfig({ NODE_ENV: "test", HILERA_AUTH_CSRF_SECRET: Buffer.alloc(32, 11).toString("base64url"),
  HILERA_AUTH_THROTTLE_SECRET: Buffer.alloc(32, 12).toString("base64url") });
const password = "Synthetic health records fixture passphrase 🪴";
const occurredAt = "2026-10-15T04:05:06.000Z";
const occurredOn = "2026-10-16";
const entries = [
  { type: "blood_pressure", occurredAt, systolic: "701.25", diastolic: "702.25" },
  { type: "blood_glucose", occurredAt, value: "703.25", unit: "mg_dl", context: "fasting" },
  { type: "hba1c", occurredAt, value: "704.25" },
  { type: "lipid_panel", occurredAt, unit: "mmol_l", totalCholesterol: "705.25", hdl: null, ldl: "706.25", triglycerides: null },
  { type: "weight", occurredAt, value: "707.25", unit: "lb" },
  { type: "waist_circumference", occurredAt, value: "708.25", unit: "in" },
  { type: "physical_activity_duration", occurredOn, durationMinutes: 709 },
  { type: "sleep_duration", occurredOn, durationMinutes: 710 },
] as const satisfies readonly HealthEntry[];

async function account(db: AuthDb, name: string) {
  const email = `${name}@example.test`;
  const result = await createAccount(db, config, { email, password });
  if (result.kind !== "success") throw new Error("Synthetic account creation failed.");
  const session = await findActiveSession(db, result.token);
  if (!session) throw new Error("Synthetic account session failed.");
  await db.update(users).set({ emailVerifiedAt: new Date() }).where(eq(users.id, session.userId));
  return { userId: session.userId, token: result.token, email };
}

function corrected(entry: HealthEntry): HealthEntry {
  if ("durationMinutes" in entry) return { ...entry, durationMinutes: entry.durationMinutes + 1 };
  if ("value" in entry) return { ...entry, value: "801.25" };
  if (entry.type === "blood_pressure") return { ...entry, diastolic: "802.25" };
  return { ...entry, hdl: "803.25" };
}

describe.skipIf(!adminUrl)("disposable PostgreSQL health information", () => {
  it("replays from empty and upgrades the auth-only schema without losing an existing session", async () => {
    await disposable(async (db) => {
      await applyMigrations(db);
      expect(await db.$count(healthRecords)).toBe(0);
    });

    const old = await mkdtemp(join(tmpdir(), "hilera-auth-migration-"));
    try {
      await mkdir(join(old, "meta"));
      const journal = JSON.parse(await readFile("drizzle/meta/_journal.json", "utf8"));
      await writeFile(join(old, "meta", "_journal.json"), JSON.stringify({ ...journal, entries: journal.entries.slice(0, 1) }));
      await copyFile("drizzle/0000_auth_foundation.sql", join(old, "0000_auth_foundation.sql"));
      await disposable(async (db) => {
        await applyMigrations(db, old);
        const email = "before-upgrade@example.test";
        const passwordHash = await hashPassword(password);
        const before = await db.transaction(async (tx) => {
          const inserted = await tx.execute<{ id: string }>(sql`insert into users (normalized_email) values (${email}) returning id`);
          const userId = inserted.rows[0].id;
          await tx.execute(sql`insert into password_credentials (user_id, password_hash) values (${userId}, ${passwordHash})`);
          return { userId, token: await issueSession(tx, userId) };
        });
        await applyMigrations(db);
        expect((await findActiveSession(db, before.token))?.userId).toBe(before.userId);
        expect((await authenticateAccount(db, config, { email, password })).kind).toBe("success");
        expect(await db.$count(healthRecords)).toBe(0);
        expect(await createHealthRecord(db, before.userId, entries[0])).toBeTruthy();
      });
    } finally {
      await rm(old, { recursive: true, force: true });
    }
  }, 35000);

  it("persists and corrects all eight types, with owner-scoped current reads and preserved originals", async () => {
    await disposable(async (db) => {
      await applyMigrations(db);
      const first = await account(db, "owner-first");
      const second = await account(db, "owner-second");
      const ids = await Promise.all(entries.map((entry) => createHealthRecord(db, first.userId, entry)));
      const other = await createHealthRecord(db, second.userId, entries[0]);
      expect(await listHealthHistory(db, second.userId)).toEqual([{ id: other, provenance: "user_entered", entry: entries[0] }]);
      expect(await getCurrentHealthRecord(db, first.userId, "")).toBeNull();
      expect(await getCurrentHealthRecord(db, first.userId, other)).toBeNull();
      expect(await correctHealthRecord(db, first.userId, other, corrected(entries[0]))).toBeNull();
      expect(await correctHealthRecord(db, first.userId, ids[0], entries[1])).toBeNull();
      const before = await listHealthHistory(db, first.userId);
      expect(before.slice(0, 2).every(({ entry }) => "occurredOn" in entry)).toBe(true);
      expect(before).toHaveLength(8);
      for (const [index, entry] of entries.entries()) {
        expect(await getCurrentHealthRecord(db, first.userId, ids[index])).toEqual({ id: ids[index], provenance: "user_entered", entry });
        const replacement = await correctHealthRecord(db, first.userId, ids[index], corrected(entry));
        expect(replacement).toBeTruthy();
        expect(await getCurrentHealthRecord(db, first.userId, ids[index])).toBeNull();
        expect(await getCurrentHealthRecord(db, first.userId, replacement!)).toEqual({ id: replacement, provenance: "user_entered", entry: corrected(entry) });
        const [old] = await db.select().from(healthRecords).where(eq(healthRecords.id, ids[index]));
        const [current] = await db.select().from(healthRecords).where(eq(healthRecords.id, replacement!));
        expect(old.supersededByRecordId).toBe(replacement);
        expect(old.supersededAt).toBeTruthy();
        expect(current.supersedesRecordId).toBe(ids[index]);
        expect(current.provenance).toBe("user_entered");
      }
      expect(await listHealthHistory(db, first.userId)).toHaveLength(8);
      expect(await db.$count(healthRecords)).toBe(17);
      const [original] = await db.select().from(weightRecords).where(eq(weightRecords.healthRecordId, ids[4]));
      expect(original.value).toBe(entries[4].value);
    });
  }, 35000);

  it("coalesces concurrent corrections and rolls back invalid subtypes, fields, and ownership links", async () => {
    await disposable(async (db) => {
      await applyMigrations(db);
      const first = await account(db, "concurrent-owner");
      const second = await account(db, "concurrent-other");
      const id = await createHealthRecord(db, first.userId, entries[4]);
      const replacements = await Promise.all([
        correctHealthRecord(db, first.userId, id, corrected(entries[4])),
        correctHealthRecord(db, first.userId, id, { ...entries[4], value: "844" }),
      ]);
      expect(replacements.filter(Boolean)).toHaveLength(1);
      const [current] = await listHealthHistory(db, first.userId);
      expect(current.id).toBe(replacements.find(Boolean));
      await expect(db.insert(lipidPanelRecords).values({ healthRecordId: id, unit: "mg_dl", hdl: "23" }))
        .rejects.toMatchObject({ cause: { code: "23503" } });
      await expect(createHealthRecord(db, first.userId, { ...entries[3], totalCholesterol: null, ldl: null }))
        .rejects.toMatchObject({ cause: { code: "23514" } });
      await expect(createHealthRecord(db, first.userId, { ...entries[4], unit: "cm" as "lb" }))
        .rejects.toMatchObject({ cause: { code: "22P02" } });
      await expect(createHealthRecord(db, first.userId, { ...entries[1], context: "unknown" as "fasting" }))
        .rejects.toMatchObject({ cause: { code: "22P02" } });
      await expect(db.insert(healthRecords).values({
        userId: second.userId, recordType: "weight", occurredAt, supersedesRecordId: current.id,
      })).rejects.toMatchObject({ cause: { code: "23503" } });
      expect(await db.$count(healthRecords)).toBe(2);
    });
  }, 35000);

  it("restores both accounts and typed health lineage, invalidates restored sessions, and preserves self-only access", async () => {
    const directory = await mkdtemp(join(tmpdir(), "hilera-health-backup-"));
    const backup = join(directory, "synthetic.dump");
    try {
      const fixture = await disposable(async (db, name, url) => {
        await applyMigrations(db);
        const first = await account(db, "restore-health-first");
        const second = await account(db, "restore-health-second");
        const original = await createHealthRecord(db, first.userId, entries[3]);
        const replacement = await correctHealthRecord(db, first.userId, original, corrected(entries[3]));
        const other = await createHealthRecord(db, second.userId, entries[4]);
        runPgTool("pg_dump", ["--format=custom", "--no-owner", "--no-privileges", "--file", backup], name, url);
        return { first, second, original, replacement, other };
      });

      await disposable(async (db, name, url) => {
        runPgTool("pg_restore", ["--exit-on-error", "--no-owner", "--no-privileges", backup], name, url);
        expect(await db.$count(users)).toBe(2);
        expect(await db.$count(healthRecords)).toBe(3);
        expect(await db.$count(lipidPanelRecords)).toBe(2);
        expect(await db.$count(weightRecords)).toBe(1);
        const [old] = await db.select().from(healthRecords).where(eq(healthRecords.id, fixture.original));
        const [newer] = await db.select().from(healthRecords).where(eq(healthRecords.id, fixture.replacement!));
        expect(old.supersededByRecordId).toBe(fixture.replacement);
        expect(newer.supersedesRecordId).toBe(fixture.original);
        expect(newer.userId).toBe(fixture.first.userId);
        const catalog = await db.execute(sql`select indexname from pg_indexes where tablename = 'health_records'`);
        expect(catalog.rows.map((row) => row.indexname)).toContain("health_records_current_history_idx");
        await expect(db.insert(weightRecords).values({ healthRecordId: randomUUID(), value: "901", unit: "lb" }))
          .rejects.toMatchObject({ cause: { code: "23503" } });

        expect(await findActiveSession(db, fixture.first.token)).not.toBeNull();
        await db.update(authSessions).set({ revokedAt: sql`greatest(${authSessions.createdAt}, clock_timestamp())` })
          .where(isNull(authSessions.revokedAt));
        expect(await findActiveSession(db, fixture.first.token)).toBeNull();
        expect(await findActiveSession(db, fixture.second.token)).toBeNull();
        const login = await authenticateAccount(db, config, { email: fixture.first.email, password });
        if (login.kind !== "success") throw new Error("Synthetic restore sign-in failed.");
        const session = await findActiveSession(db, login.token);
        expect(session?.userId).toBe(fixture.first.userId);
        expect(await listHealthHistory(db, session!.userId)).toEqual([{ id: fixture.replacement, provenance: "user_entered", entry: corrected(entries[3]) }]);
        expect(await getCurrentHealthRecord(db, session!.userId, fixture.other)).toBeNull();
        expect(await correctHealthRecord(db, session!.userId, fixture.other, corrected(entries[4]))).toBeNull();
      });
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  }, 70000);
});
