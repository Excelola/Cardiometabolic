import { hash } from "@node-rs/argon2";
import { describe, expect, it } from "vitest";

import { ARGON2_OPTIONS, hashPassword, validateNewPassword, verifyPassword } from "./password";

const password = "Synthetïc garden phrase 🪴 4z";

describe("Argon2id credentials", () => {
  it("accepts spaces and Unicode, counts characters, and rejects listed passwords offline", () => {
    expect(validateNewPassword(password)).toBe("valid");
    expect(validateNewPassword("🪴".repeat(128))).toBe("valid");
    expect(validateNewPassword("🪴".repeat(129))).toBe("length");
    expect(validateNewPassword("x".repeat(14))).toBe("length");
    expect(validateNewPassword("x".repeat(15) + "\n")).toBe("invalid");
    expect(validateNewPassword("passwordpassword")).toBe("blocked");
  });

  it("uses fresh salts, NFC-stable Unicode and equal public verification outcomes for missing or wrong credentials", async () => {
    const first = await hashPassword(password);
    const second = await hashPassword(password);
    expect(first).toMatch(/^\$argon2id\$v=19\$m=19456,t=2,p=1\$/);
    expect(first.split("$")[4]).not.toBe(second.split("$")[4]);
    expect(await verifyPassword(password, first)).toEqual({ valid: true, needsRehash: false });
    expect(await verifyPassword(password.normalize("NFD"), first)).toEqual({ valid: true, needsRehash: false });
    expect(await verifyPassword(password, first.replace("m=19456", "m=99999"))).toEqual({ valid: false, needsRehash: false });
  });

  it("detects weaker accepted parameters only after successful verification", async () => {
    const legacy = await hash(password, { ...ARGON2_OPTIONS, memoryCost: 12288 });
    expect(await verifyPassword(password, legacy)).toEqual({ valid: true, needsRehash: true });
    expect(await verifyPassword("wrong synthetic phrase", legacy)).toEqual({ valid: false, needsRehash: false });
  });

  it("caps concurrent work without an unbounded queue", async () => {
    const attempts = await Promise.allSettled(Array.from({ length: 5 }, () => hashPassword(password)));
    expect(attempts.filter((result) => result.status === "fulfilled")).toHaveLength(4);
    expect(attempts.filter((result) => result.status === "rejected")).toHaveLength(1);
    expect(await hashPassword(password)).toMatch(/^\$argon2id\$/);
  });
});
