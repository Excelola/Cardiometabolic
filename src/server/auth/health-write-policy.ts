import "server-only";

import { eq } from "drizzle-orm";

import type { AuthTransaction } from "@/server/db/auth-db";
import { users } from "@/server/db/schema";

export class EmailVerificationRequired extends Error {
  constructor() {
    super("Email verification is required before saving health information.");
    this.name = "EmailVerificationRequired";
  }
}

/** Lock the owner before health/document rows and hold the lock through the write. */
export async function requireHealthWritePermission(tx: AuthTransaction, userId: string): Promise<void> {
  const [user] = await tx.select({ verifiedAt: users.emailVerifiedAt, required: users.verificationRequiredForHealth })
    .from(users).where(eq(users.id, userId)).for("update");
  if (!user || (user.required && !user.verifiedAt)) throw new EmailVerificationRequired();
}
