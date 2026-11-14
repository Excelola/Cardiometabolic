import { describe, expect, it } from "vitest";

import { emailCodeDigest, generateEmailCode, matchesEmailCode } from "./email-challenge-code";

describe("email challenge codes", () => {
  const secret = Buffer.alloc(32, 9);
  const userId = "synthetic-owner";
  const email = "Case@example.test";
  const hash = "synthetic-credential-hash";

  it("generates independent 128-bit canonical codes", () => {
    const first = generateEmailCode();
    const second = generateEmailCode();
    expect(Buffer.from(first, "base64url")).toHaveLength(16);
    expect(first).toHaveLength(22);
    expect(second).not.toBe(first);
  });

  it("binds proof to its purpose, owner, exact email and secret", () => {
    const code = generateEmailCode();
    const digest = emailCodeDigest(secret, "reset_password", userId, email, code, hash)!;
    expect(matchesEmailCode(digest, emailCodeDigest(secret, "reset_password", userId, email, code, hash))).toBe(true);
    expect(matchesEmailCode(digest, emailCodeDigest(secret, "verify_email", userId, email, code))).toBe(false);
    expect(matchesEmailCode(digest, emailCodeDigest(secret, "reset_password", "another-owner", email, code, hash))).toBe(false);
    expect(matchesEmailCode(digest, emailCodeDigest(secret, "reset_password", userId, "case@example.test", code, hash))).toBe(false);
    expect(matchesEmailCode(digest, emailCodeDigest(Buffer.alloc(32, 8), "reset_password", userId, email, code, hash))).toBe(false);
    expect(matchesEmailCode(digest, emailCodeDigest(secret, "reset_password", userId, email, code, "changed-hash"))).toBe(false);
    expect(emailCodeDigest(secret, "reset_password", userId, email, "bad")).toBeNull();
  });
});
