import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { copyFile, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { eq, sql } from "drizzle-orm";
import { describe, expect, it } from "vitest";

import { applyMigrations, disposable, adminUrl, runPgTool } from "@/server/db/disposable-postgres";
import { healthDocumentCandidates, healthDocumentUploads } from "@/server/db/document-schema";
import { healthRecords } from "@/server/db/health-schema";
import { users } from "@/server/db/schema";
import { createHealthRecord, listHealthHistory } from "@/server/health/repository";
import { FakeOcrProvider, FakeScanner } from "./providers";
import { cancelDocumentUpload, cleanupExpiredDocumentUploads, confirmDocumentUpload, getOwnedReview, processDocumentUpload } from "./service";

const png = readFileSync(new URL("./fixtures/synthetic.png", import.meta.url));
function file() { return new File([new Uint8Array(png)], "synthetic.png", { type: "image/png" }); }
const ocr = new FakeOcrProvider([{ number: 1, text: "Blood pressure: 123/83 mmHg\nWeight: 71 kg\nDiagnosis: synthetic only" }]);

describe.skipIf(!adminUrl)("disposable PostgreSQL document workflow", () => {
  it("isolates owners, confirms edited candidates exactly once, and removes temporary data", async () => {
    await disposable(async (db) => {
      await applyMigrations(db);
      const [{ id: userA }, { id: userB }] = await db.insert(users).values([
        { normalizedEmail: `document-a-${randomUUID()}@example.test` },
        { normalizedEmail: `document-b-${randomUUID()}@example.test` },
      ]).returning({ id: users.id });
      let calls = 0;
      const infected = await processDocumentUpload(db, userA, file(), new FakeScanner("infected"), { extract: async () => { calls++; return { pages: [] }; } });
      expect(infected).toEqual({ error: "unsafe_file" });
      expect(calls).toBe(0);
      expect(await processDocumentUpload(db, userA, file(), new FakeScanner("unavailable"), ocr)).toEqual({ error: "temporary_service_problem" });
      expect(await db.$count(healthDocumentUploads)).toBe(0);

      const result = await processDocumentUpload(db, userA, file(), new FakeScanner("clean"), ocr);
      if (!("id" in result)) throw new Error("Synthetic upload failed");
      expect(result.status).toBe("review");
      expect(await getOwnedReview(db, userB, result.id)).toBeNull();
      const review = await getOwnedReview(db, userA, result.id);
      expect(review?.candidates).toHaveLength(2);
      const pressure = review!.candidates.find((item) => item.recordType === "blood_pressure")!;
      const weight = review!.candidates.find((item) => item.recordType === "weight")!;
      const form = new FormData();
      form.set(`${pressure.id}:selection`, "include");
      form.set(`${pressure.id}:systolic`, "124");
      form.set(`${pressure.id}:diastolic`, "84");
      form.set(`${pressure.id}:occurredAt`, "2026-10-15T04:05:06.000Z");
      form.set(`${weight.id}:selection`, "include");
      form.set(`${weight.id}:value`, "71");
      form.set(`${weight.id}:unit`, "kg");
      form.set(`${weight.id}:occurredAt`, "2026-10-15T04:05:06.000Z");
      expect(await confirmDocumentUpload(db, userB, result.id, form)).toBe("unavailable");
      const invalid = new FormData();
      for (const [key, value] of form) invalid.set(key, value);
      invalid.set(`${weight.id}:unit`, "unsupported");
      expect(await confirmDocumentUpload(db, userA, result.id, invalid)).toBe("invalid");
      expect(await db.$count(healthRecords)).toBe(0);
      const simultaneous = await Promise.all([
        confirmDocumentUpload(db, userA, result.id, form),
        confirmDocumentUpload(db, userA, result.id, form),
      ]);
      expect(simultaneous.sort()).toEqual(["confirmed", "unavailable"]);
      expect(await confirmDocumentUpload(db, userA, result.id, form)).toBe("unavailable");
      const history = await listHealthHistory(db, userA);
      expect(history).toHaveLength(2);
      expect(history.every((entry) => entry.provenance === "document_assisted")).toBe(true);
      expect(history.find((item) => item.entry.type === "blood_pressure")?.entry).toMatchObject({ systolic: "124", diastolic: "84" });
      expect(await listHealthHistory(db, userB)).toEqual([]);
      expect(await db.$count(healthDocumentCandidates)).toBe(0);
      expect(await db.$count(healthRecords)).toBe(2);
    });
  }, 35000);

  it("upgrades the current manual schema without changing existing records", async () => {
    const old = await mkdtemp(join(tmpdir(), "hilera-manual-upgrade-"));
    try {
      await mkdir(join(old, "meta"));
      const journal = JSON.parse(await readFile("drizzle/meta/_journal.json", "utf8"));
      await writeFile(join(old, "meta", "_journal.json"), JSON.stringify({ ...journal, entries: journal.entries.slice(0, 2) }));
      await copyFile("drizzle/0000_auth_foundation.sql", join(old, "0000_auth_foundation.sql"));
      await copyFile("drizzle/0001_manual_health_persistence.sql", join(old, "0001_manual_health_persistence.sql"));
      await disposable(async (db) => {
        await applyMigrations(db, old);
        const [{ id: owner }] = await db.insert(users).values({ normalizedEmail: `manual-upgrade-${randomUUID()}@example.test` }).returning({ id: users.id });
        const oldId = await createHealthRecord(db, owner, { type: "weight", occurredAt: "2026-10-15T04:05:06.000Z", value: "71", unit: "kg" });
        await applyMigrations(db);
        expect(await listHealthHistory(db, owner)).toMatchObject([{ id: oldId, provenance: "user_entered" }]);
        expect(await db.$count(healthDocumentUploads)).toBe(0);
      });
    } finally { await rm(old, { recursive: true, force: true }); }
  }, 35000);

  it("supports removal, cancellation, expiry and idempotent cleanup", async () => {
    await disposable(async (db) => {
      await applyMigrations(db);
      const [{ id: owner }] = await db.insert(users).values({ normalizedEmail: `document-owner-${randomUUID()}@example.test` }).returning({ id: users.id });
      const created = await processDocumentUpload(db, owner, file(), new FakeScanner("clean"), ocr);
      if (!("id" in created)) throw new Error("Synthetic upload failed");
      const review = await getOwnedReview(db, owner, created.id);
      const weight = review!.candidates.find((item) => item.recordType === "weight")!;
      const pressure = review!.candidates.find((item) => item.recordType === "blood_pressure")!;
      const form = new FormData();
      form.set(`${pressure.id}:selection`, "remove");
      form.set(`${weight.id}:selection`, "include");
      form.set(`${weight.id}:value`, "71");
      form.set(`${weight.id}:unit`, "kg");
      form.set(`${weight.id}:occurredAt`, "2026-10-15T04:05:06.000Z");
      expect(await confirmDocumentUpload(db, owner, created.id, form)).toBe("confirmed");
      expect(await db.$count(healthRecords)).toBe(1);
      const cancelled = await processDocumentUpload(db, owner, file(), new FakeScanner("clean"), ocr);
      if (!("id" in cancelled)) throw new Error("Synthetic upload failed");
      expect(await cancelDocumentUpload(db, owner, cancelled.id)).toBe(true);
      expect(await cancelDocumentUpload(db, owner, cancelled.id)).toBe(false);
      expect(await db.select().from(healthDocumentCandidates).where(eq(healthDocumentCandidates.uploadId, cancelled.id))).toEqual([]);
      const abandoned = await processDocumentUpload(db, owner, file(), new FakeScanner("clean"), ocr);
      if (!("id" in abandoned)) throw new Error("Synthetic upload failed");
      const past = Date.now();
      await db.update(healthDocumentUploads).set({ createdAt: new Date(past - 26 * 3600_000), expiresAt: new Date(past - 2 * 3600_000) })
        .where(eq(healthDocumentUploads.id, abandoned.id));
      expect(await getOwnedReview(db, owner, abandoned.id)).toBeNull();
      expect(await confirmDocumentUpload(db, owner, abandoned.id, form)).toBe("expired");
      expect(await cleanupExpiredDocumentUploads(db)).toBe(1);
      expect(await cleanupExpiredDocumentUploads(db)).toBe(0);
      expect(await db.select().from(healthDocumentCandidates).where(eq(healthDocumentCandidates.uploadId, abandoned.id))).toEqual([]);
      expect((await db.select({ count: sql<number>`count(*)` }).from(healthDocumentUploads).where(eq(healthDocumentUploads.id, abandoned.id)))[0].count).toBe("0");
    });
  }, 35000);

  it("restores confirmed Document Assisted records without raw files or candidate residue", async () => {
    const directory = await mkdtemp(join(tmpdir(), "hilera-document-restore-"));
    const backup = join(directory, "synthetic.dump");
    try {
      const fixture = await disposable(async (db, name, url) => {
        await applyMigrations(db);
        const [{ id: owner }] = await db.insert(users).values({ normalizedEmail: `document-restore-${randomUUID()}@example.test` }).returning({ id: users.id });
        const result = await processDocumentUpload(db, owner, file(), new FakeScanner("clean"), ocr);
        if (!("id" in result)) throw new Error("Synthetic upload failed");
        const review = await getOwnedReview(db, owner, result.id);
        const candidate = review!.candidates.find((item) => item.recordType === "weight")!;
        const removed = review!.candidates.find((item) => item.recordType === "blood_pressure")!;
        const form = new FormData();
        form.set(`${removed.id}:selection`, "remove");
        form.set(`${candidate.id}:selection`, "include");
        form.set(`${candidate.id}:value`, "71");
        form.set(`${candidate.id}:unit`, "kg");
        form.set(`${candidate.id}:occurredAt`, "2026-10-15T04:05:06.000Z");
        expect(await confirmDocumentUpload(db, owner, result.id, form)).toBe("confirmed");
        runPgTool("pg_dump", ["--format=custom", "--no-owner", "--no-privileges", "--file", backup], name, url);
        return { owner };
      });
      await disposable(async (db, name, url) => {
        runPgTool("pg_restore", ["--exit-on-error", "--no-owner", "--no-privileges", backup], name, url);
        const history = await listHealthHistory(db, fixture.owner);
        expect(history).toHaveLength(1);
        expect(history[0].provenance).toBe("document_assisted");
        expect(await db.$count(healthDocumentCandidates)).toBe(0);
        const columns = await db.execute(sql`select column_name from information_schema.columns where table_name = 'health_document_uploads'`);
        expect(columns.rows.map((row) => row.column_name)).not.toContain("document_bytes");
      });
    } finally { await rm(directory, { recursive: true, force: true }); }
  }, 70000);
});
