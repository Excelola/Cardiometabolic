import { copyFile, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { eq, sql } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { adminUrl, applyMigrations, disposable } from "@/server/db/disposable-postgres";
import { healthDocumentCandidates, healthDocumentUploads } from "@/server/db/document-schema";
import { users } from "@/server/db/schema";
import { createHealthRecord, listHealthHistory } from "@/server/health/repository";
import { readAuthConfig } from "./config";
import { authenticateAccount, createAccount } from "./credentials";
import { hashPassword } from "./password";
import { findActiveSession, issueSession } from "./sessions";

const config = readAuthConfig({ NODE_ENV: "test", HILERA_AUTH_CSRF_SECRET: Buffer.alloc(32, 11).toString("base64url"),
  HILERA_AUTH_THROTTLE_SECRET: Buffer.alloc(32, 12).toString("base64url") });
const password = "Synthetic upgrade account password 2026!";

describe.skipIf(!adminUrl)("populated 0002 upgrade", () => {
  it("preserves legacy accounts, sessions, credentials, health and document ownership", async () => {
    const old = await mkdtemp(join(tmpdir(), "hilera-0002-upgrade-"));
    try {
      await mkdir(join(old, "meta"));
      const journal = JSON.parse(await readFile("drizzle/meta/_journal.json", "utf8"));
      await writeFile(join(old, "meta", "_journal.json"), JSON.stringify({ ...journal, entries: journal.entries.slice(0, 3) }));
      for (const name of ["0000_auth_foundation.sql", "0001_manual_health_persistence.sql", "0002_health_document_upload.sql"]) {
        await copyFile(join("drizzle", name), join(old, name));
      }
      await disposable(async (db) => {
        await applyMigrations(db, old);
        const hash = await hashPassword(password);
        const seeded = await db.transaction(async (tx) => {
          const owner = (await tx.execute<{ id: string }>(sql`insert into users (normalized_email) values ('upgrade-owner@example.test') returning id`)).rows[0].id;
          const other = (await tx.execute<{ id: string }>(sql`insert into users (normalized_email) values ('upgrade-empty@example.test') returning id`)).rows[0].id;
          await tx.execute(sql`insert into password_credentials (user_id, password_hash) values (${owner}, ${hash}), (${other}, ${hash})`);
          const token = await issueSession(tx, owner);
          const record = (await tx.execute<{ id: string }>(sql`insert into health_records (user_id, record_type, occurred_at) values (${owner}, 'weight', '2026-01-01T00:00:00Z') returning id`)).rows[0].id;
          await tx.execute(sql`insert into weight_records (health_record_id, weight_value, unit) values (${record}, 71, 'kg')`);
          const upload = (await tx.execute<{ id: string }>(sql`insert into health_document_uploads (owner_user_id, status, mime_type, byte_size, expires_at) values (${owner}, 'review', 'image/png', 100, now() + interval '1 hour') returning id`)).rows[0].id;
          const candidate = (await tx.execute<{ id: string }>(sql`insert into health_document_candidates (upload_id, record_type, candidate_value, unit) values (${upload}, 'weight', 72, 'kg') returning id`)).rows[0].id;
          return { owner, other, token, record, upload, candidate };
        });
        await applyMigrations(db);
        for (const id of [seeded.owner, seeded.other]) {
          const [user] = await db.select().from(users).where(eq(users.id, id));
          expect(user).toMatchObject({ emailVerifiedAt: null, legacyRecoveryRestricted: true, verificationRequiredForHealth: false });
        }
        expect((await findActiveSession(db, seeded.token))?.userId).toBe(seeded.owner);
        expect((await authenticateAccount(db, config, { email: "upgrade-owner@example.test", password })).kind).toBe("success");
        expect(await listHealthHistory(db, seeded.owner)).toMatchObject([{ id: seeded.record }]);
        expect(await listHealthHistory(db, seeded.other)).toEqual([]);
        expect(await db.select().from(healthDocumentUploads).where(eq(healthDocumentUploads.id, seeded.upload))).toMatchObject([{ ownerUserId: seeded.owner, status: "review" }]);
        expect(await db.select().from(healthDocumentCandidates).where(eq(healthDocumentCandidates.id, seeded.candidate))).toMatchObject([{ uploadId: seeded.upload, recordType: "weight" }]);
        const created = await createAccount(db, config, { email: "after-upgrade@example.test", password });
        if (created.kind !== "success") throw new Error("Synthetic account creation failed");
        const principal = await findActiveSession(db, created.token);
        if (!principal) throw new Error("Synthetic session missing");
        await expect(createHealthRecord(db, principal.userId, { type: "weight", value: "71", unit: "kg", occurredAt: "2026-01-01T00:00:00Z" })).rejects.toThrow("Email verification is required");
      });
    } finally { await rm(old, { recursive: true, force: true }); }
  }, 60000);
});
