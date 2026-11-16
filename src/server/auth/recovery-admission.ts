import "server-only";

import { createHmac } from "node:crypto";
import { and, count, eq, lte, ne } from "drizzle-orm";

import type { AuthDb } from "@/server/db/auth-db";
import { recoveryThrottleBuckets } from "@/server/db/schema";

type Purpose = "verify_request" | "verify_attempt" | "recovery_request" | "recovery_attempt";
const WINDOW_MS = 10 * 60 * 1000;
const GLOBAL_LIMIT = 100;
const IDENTITY_LIMIT = 5;
const MAX_BUCKETS = 4096;

function key(secret: Uint8Array, purpose: Purpose, identity: string): Buffer {
  return createHmac("sha256", secret).update("hilera:recovery-admission:v1\0")
    .update(purpose).update("\0").update(identity).digest();
}

/** A separate bounded budget prevents recovery abuse from exhausting sign-in admission. */
export async function reserveRecoveryAdmission(db: AuthDb, secret: Uint8Array, purpose: Purpose, identity: string): Promise<boolean> {
  const global = key(secret, purpose, "global");
  const identifier = key(secret, purpose, `identity:${identity}`);
  try {
    return await db.transaction(async (tx) => {
      const now = new Date();
      await tx.insert(recoveryThrottleBuckets).values({ bucketKey: global, windowEndsAt: now }).onConflictDoNothing();
      const [fleet] = await tx.select().from(recoveryThrottleBuckets).where(eq(recoveryThrottleBuckets.bucketKey, global)).for("update");
      const fleetCount = fleet.windowEndsAt > now ? fleet.attemptCount : 0;
      if (fleetCount >= GLOBAL_LIMIT) return false;
      await tx.update(recoveryThrottleBuckets).set({ attemptCount: fleetCount + 1,
        windowEndsAt: fleet.windowEndsAt > now ? fleet.windowEndsAt : new Date(now.getTime() + WINDOW_MS) })
        .where(eq(recoveryThrottleBuckets.bucketKey, global));
      const [existing] = await tx.select().from(recoveryThrottleBuckets).where(eq(recoveryThrottleBuckets.bucketKey, identifier)).for("update");
      if (!existing) {
        await tx.delete(recoveryThrottleBuckets).where(and(lte(recoveryThrottleBuckets.windowEndsAt, now), ne(recoveryThrottleBuckets.bucketKey, global)));
        const [{ value }] = await tx.select({ value: count() }).from(recoveryThrottleBuckets);
        if (value >= MAX_BUCKETS) return false;
      }
      const active = Boolean(existing && existing.windowEndsAt > now);
      const attempts = active ? existing!.attemptCount : 0;
      if (attempts >= IDENTITY_LIMIT) return false;
      const expiry = active ? existing!.windowEndsAt : new Date(now.getTime() + WINDOW_MS);
      await tx.insert(recoveryThrottleBuckets).values({ bucketKey: identifier, attemptCount: attempts + 1, windowEndsAt: expiry })
        .onConflictDoUpdate({ target: recoveryThrottleBuckets.bucketKey, set: { attemptCount: attempts + 1, windowEndsAt: expiry } });
      return true;
    });
  } catch {
    return false;
  }
}
