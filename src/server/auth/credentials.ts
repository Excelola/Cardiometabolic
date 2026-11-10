import "server-only";

import { and, eq } from "drizzle-orm";

import type { AuthDb } from "../db/auth-db";
import { passwordCredentials, users } from "../db/schema";
import type { AuthConfig } from "./config";
import { hashPassword, verifyPassword } from "./password";
import { recordAuthSecurityEvent } from "./security-events";
import { findActiveSession, issueSession, replacePresentedSession } from "./sessions";
import { reserveAuthAdmission } from "./throttle";

type CredentialInput = Readonly<{ email: string; password: string; previousToken?: string }>;
type Outcome = { kind: "success"; token: string }
  | { kind: "registration_failed" | "invalid_credentials" | "throttled" | "unavailable" };

export async function createAccount(db: AuthDb, config: AuthConfig, input: CredentialInput): Promise<Outcome> {
  const admission = await reserveAuthAdmission(db, config, input.email);
  if (admission !== "admitted") return { kind: admission };
  if (await findActiveSession(db, input.previousToken)) return { kind: "registration_failed" };
  const passwordHash = await hashPassword(input.password);

  return db.transaction(async (tx) => {
    const [user] = await tx.insert(users).values({ normalizedEmail: input.email })
      .onConflictDoNothing({ target: users.normalizedEmail }).returning({ id: users.id });
    if (!user) return { kind: "registration_failed" };

    await tx.insert(passwordCredentials).values({ userId: user.id, passwordHash });
    const token = await issueSession(tx, user.id);
    await recordAuthSecurityEvent(tx, { type: "account_created", userId: user.id });
    return { kind: "success", token };
  });
}

export async function authenticateAccount(db: AuthDb, config: AuthConfig, input: CredentialInput): Promise<Outcome> {
  const admission = await reserveAuthAdmission(db, config, input.email);
  if (admission !== "admitted") return { kind: admission };

  const [credential] = await db.select({ userId: users.id, hash: passwordCredentials.passwordHash })
    .from(users).innerJoin(passwordCredentials, eq(passwordCredentials.userId, users.id))
    .where(eq(users.normalizedEmail, input.email)).limit(1);
  const verification = await verifyPassword(input.password, credential?.hash);
  if (!credential || !verification.valid) {
    await recordAuthSecurityEvent(db, { type: "sign_in_failed" });
    return { kind: "invalid_credentials" };
  }

  const upgradedHash = verification.needsRehash ? await hashPassword(input.password) : undefined;
  return db.transaction(async (tx) => {
    // Match the user -> credential -> session lock order used by account-wide revocation.
    const [user] = await tx.select({ id: users.id }).from(users).where(eq(users.id, credential.userId)).for("update");
    if (!user) return { kind: "invalid_credentials" };
    const [current] = await tx.select({ hash: passwordCredentials.passwordHash }).from(passwordCredentials)
      .where(eq(passwordCredentials.userId, user.id)).for("update");
    if (current?.hash !== credential.hash) return { kind: "invalid_credentials" };
    if (upgradedHash) {
      await tx.update(passwordCredentials).set({ passwordHash: upgradedHash })
        .where(and(eq(passwordCredentials.userId, user.id), eq(passwordCredentials.passwordHash, credential.hash)));
    }

    const now = new Date();
    await replacePresentedSession(tx, input.previousToken, now);
    const token = await issueSession(tx, user.id, now);
    await recordAuthSecurityEvent(tx, { type: "sign_in_succeeded", userId: user.id });
    return { kind: "success", token };
  });
}
