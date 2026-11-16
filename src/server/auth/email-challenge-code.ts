import "server-only";

import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export type EmailChallengePurpose = "verify_email" | "reset_password";

// 128 random bits encoded without padding. These are technical limits, not product promises.
export const EMAIL_CODE_LIFETIME_MS = 10 * 60 * 1000;
export const EMAIL_CODE_MAX_ATTEMPTS = 5;

export function generateEmailCode(): string {
  return randomBytes(16).toString("base64url");
}

export function emailCodeDigest(secret: Uint8Array, purpose: EmailChallengePurpose, userId: string, email: string, code: string, credentialHash?: string): Buffer | null {
  if (secret.byteLength !== 32 || !/^[A-Za-z0-9_-]{22}$/.test(code)) return null;
  if (purpose === "reset_password" && !credentialHash) return null;
  const bytes = Buffer.from(code, "base64url");
  if (bytes.length !== 16 || bytes.toString("base64url") !== code) return null;
  return createHmac("sha256", secret).update("hilera:email-challenge:v1\0")
    .update(purpose).update("\0").update(userId).update("\0").update(email).update("\0").update(bytes)
    .update("\0").update(purpose === "reset_password" ? credentialHash! : "").digest();
}

export function matchesEmailCode(expected: Buffer, actual: Buffer | null): boolean {
  return actual !== null && actual.length === 32 && expected.length === 32 && timingSafeEqual(expected, actual);
}
