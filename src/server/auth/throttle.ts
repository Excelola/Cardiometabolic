import "server-only";

import { createHmac } from "node:crypto";
import { and, count, eq, lte } from "drizzle-orm";

import type { AuthDb } from "../db/auth-db";
import { authThrottleBuckets } from "../db/schema";
import type { AuthConfig, AuthThrottlePolicy } from "./config";

const GLOBAL_KEY = Buffer.alloc(32);
const MAX_IDENTITIES = 4096;

export function nextIdentityDelay(attempt: number, policy: AuthThrottlePolicy): number {
  if (attempt <= policy.identityLimit) return 0;
  return Math.min(policy.maxDelayMs, 1_000 * 2 ** Math.min(attempt - policy.identityLimit - 1, 17));
}

export async function reserveAuthAdmission(
  db: AuthDb,
  config: Pick<AuthConfig, "throttle" | "throttleSecret">,
  normalizedEmail: string,
  testTime?: Date,
): Promise<"admitted" | "throttled" | "unavailable"> {
  const policy = config.throttle;
  const identity = createHmac("sha256", config.throttleSecret)
    .update("hilera:auth-identifier:v1\0").update(normalizedEmail).digest();
  const globalFilter = and(eq(authThrottleBuckets.scope, "global"), eq(authThrottleBuckets.bucketKey, GLOBAL_KEY));
  const identityFilter = and(eq(authThrottleBuckets.scope, "identity"), eq(authThrottleBuckets.bucketKey, identity));

  try {
    return await db.transaction(async (tx) => {
      const initial = testTime ?? new Date();
      await tx.insert(authThrottleBuckets).values({ scope: "global", bucketKey: GLOBAL_KEY, windowEndsAt: initial, nextAllowedAt: initial }).onConflictDoNothing();
      // Every writer takes this lock first. New identity keys and reservations cannot race past their bounds.
      const [global] = await tx.select().from(authThrottleBuckets).where(globalFilter).for("update");
      const now = testTime ?? new Date();
      const globalActive = global.windowEndsAt > now;
      const globalCount = globalActive ? global.attemptCount : 0;
      if (globalCount >= policy.globalLimit) return "throttled";

      const [bucket] = await tx.select().from(authThrottleBuckets).where(identityFilter);
      const active = bucket && bucket.windowEndsAt > now;
      if (active && bucket.nextAllowedAt > now) return "throttled";

      if (!bucket) {
        await tx.delete(authThrottleBuckets).where(and(eq(authThrottleBuckets.scope, "identity"), lte(authThrottleBuckets.windowEndsAt, now)));
        const [total] = await tx.select({ value: count() }).from(authThrottleBuckets).where(eq(authThrottleBuckets.scope, "identity"));
        if (total.value >= MAX_IDENTITIES) return "throttled";
      }

      const attempt = Math.min((active ? bucket.attemptCount : 0) + 1, 32767);
      const windowEndsAt = active ? bucket.windowEndsAt : new Date(now.getTime() + policy.identityWindowMs);
      const nextAllowedAt = new Date(Math.min(windowEndsAt.getTime(), now.getTime() + nextIdentityDelay(attempt, policy)));
      await tx.insert(authThrottleBuckets).values({ scope: "identity", bucketKey: identity, attemptCount: attempt, windowEndsAt, nextAllowedAt })
        .onConflictDoUpdate({ target: [authThrottleBuckets.scope, authThrottleBuckets.bucketKey], set: { attemptCount: attempt, windowEndsAt, nextAllowedAt } });
      await tx.update(authThrottleBuckets).set({
        attemptCount: globalCount + 1,
        windowEndsAt: globalActive ? global.windowEndsAt : new Date(now.getTime() + policy.globalWindowMs),
      }).where(globalFilter);
      return "admitted";
    });
  } catch {
    return "unavailable";
  }
}
