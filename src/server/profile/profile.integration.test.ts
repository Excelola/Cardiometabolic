import { describe, expect, it } from "vitest";
import { adminUrl, applyMigrations, disposable } from "@/server/db/disposable-postgres";
import { users } from "@/server/db/schema";
import { getProfile, saveProfile } from "./repository";

describe.skipIf(!adminUrl)("profile ownership on disposable PostgreSQL", () => {
  it("preserves partial work and isolates two owners", async () => {
    await disposable(async (db) => {
      await applyMigrations(db);
      const [a, b] = await db.insert(users).values([{ normalizedEmail: "profile-a@example.test" }, { normalizedEmail: "profile-b@example.test" }]).returning({ id: users.id });
      await saveProfile(db, a.id, { preferredName: "Ada", dateOfBirth: null, market: null });
      expect(await getProfile(db, b.id)).toBeNull();
      expect(await getProfile(db, a.id)).toMatchObject({ preferredName: "Ada", dateOfBirth: null });
      await saveProfile(db, a.id, { preferredName: "Ada", dateOfBirth: "2000-02-29", market: "NG" });
      await saveProfile(db, b.id, { preferredName: "Bola", dateOfBirth: null, market: null });
      expect(await getProfile(db, a.id)).toMatchObject({ preferredName: "Ada", dateOfBirth: "2000-02-29", market: "NG" });
      expect(await getProfile(db, b.id)).toMatchObject({ preferredName: "Bola", dateOfBirth: null });
    });
  }, 60000);
});
