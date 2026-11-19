import "server-only";
import { eq } from "drizzle-orm";
import type { AuthDb } from "@/server/db/auth-db";
import { userProfiles } from "@/server/db/schema";
import type { ProfileInput } from "./input";

export async function getProfile(db: AuthDb, userId: string): Promise<(typeof userProfiles.$inferSelect) | null> {
  return (await db.select().from(userProfiles).where(eq(userProfiles.userId, userId)).limit(1))[0] ?? null;
}

export async function saveProfile(db: AuthDb, userId: string, profile: ProfileInput) {
  await db.insert(userProfiles).values({ userId, ...profile }).onConflictDoUpdate({ target: userProfiles.userId, set: profile });
}
