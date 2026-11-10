import { describe, expect, it, vi } from "vitest";

import type { AuthDb } from "../db/auth-db";
import { readAuthConfig } from "./config";
import { authenticateAccount, createAccount } from "./credentials";
import { hashPassword, verifyPassword } from "./password";
import { recordAuthSecurityEvent } from "./security-events";
import { reserveAuthAdmission } from "./throttle";

vi.mock("./throttle", () => ({ reserveAuthAdmission: vi.fn() }));
vi.mock("./password", () => ({ hashPassword: vi.fn(), verifyPassword: vi.fn() }));
vi.mock("./security-events", () => ({ recordAuthSecurityEvent: vi.fn() }));

const config = readAuthConfig({ NODE_ENV: "test", HILERA_AUTH_CSRF_SECRET: Buffer.alloc(32, 1).toString("base64url"),
  HILERA_AUTH_THROTTLE_SECRET: Buffer.alloc(32, 2).toString("base64url") });
const input = { email: "synthetic@example.com", password: "synthetic passphrase 49" };
const db = {} as AuthDb;

describe("credential admission", () => {
  it.each(["throttled", "unavailable"] as const)("fails %s before reading credentials or running a KDF", async (outcome) => {
    vi.mocked(reserveAuthAdmission).mockResolvedValue(outcome);
    expect(await createAccount(db, config, input)).toEqual({ kind: outcome });
    expect(await authenticateAccount(db, config, input)).toEqual({ kind: outcome });
    expect(hashPassword).not.toHaveBeenCalled();
    expect(verifyPassword).not.toHaveBeenCalled();
  });

  it("handles an unknown identity and an incorrect password through the same rejection path", async () => {
    vi.mocked(reserveAuthAdmission).mockResolvedValue("admitted");
    vi.mocked(verifyPassword).mockResolvedValue({ valid: false, needsRehash: false });
    const query = {
      from: () => query,
      innerJoin: () => query,
      where: () => query,
      limit: vi.fn().mockResolvedValueOnce([]).mockResolvedValueOnce([{ userId: "synthetic-user", hash: "synthetic fixture" }]),
    };
    const reader = { select: () => query } as unknown as AuthDb;

    const unknown = await authenticateAccount(reader, config, input);
    const incorrect = await authenticateAccount(reader, config, input);
    expect(unknown).toEqual({ kind: "invalid_credentials" });
    expect(incorrect).toEqual(unknown);
    expect(verifyPassword).toHaveBeenNthCalledWith(1, input.password, undefined);
    expect(verifyPassword).toHaveBeenNthCalledWith(2, input.password, "synthetic fixture");
    expect(recordAuthSecurityEvent).toHaveBeenCalledTimes(2);
    expect(recordAuthSecurityEvent).toHaveBeenLastCalledWith(reader, { type: "sign_in_failed" });
  });
});
