import { headers } from "next/headers";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getAuthConfig, readAuthConfig } from "@/server/auth/config";
import { configuredEmailDelivery } from "@/server/auth/email-delivery";
import { requestEmailChallenge, verifyRegisteredEmail } from "@/server/auth/email-challenge-service";
import { issueSessionCsrf } from "@/server/auth/mutation-security";
import { getCurrentSession } from "@/server/auth/request-session";
import { getAuthDb, type AuthDb } from "@/server/db/auth-db";
import { completeRecovery, completeVerification, requestRecovery, requestVerification } from "./email-security-actions";

vi.mock("next/headers", () => ({ headers: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("@/server/auth/config", async (original) => ({ ...await original<typeof import("@/server/auth/config")>(), getAuthConfig: vi.fn() }));
vi.mock("@/server/auth/email-delivery", () => ({ configuredEmailDelivery: vi.fn() }));
vi.mock("@/server/auth/email-challenge-service", async (original) => ({ ...await original<typeof import("@/server/auth/email-challenge-service")>(),
  requestEmailChallenge: vi.fn(), verifyRegisteredEmail: vi.fn(), resetPasswordWithEmailCode: vi.fn() }));
vi.mock("@/server/auth/request-session", () => ({ getCurrentSession: vi.fn() }));
vi.mock("@/server/db/auth-db", () => ({ getAuthDb: vi.fn() }));

const config = readAuthConfig({ NODE_ENV: "test", HILERA_AUTH_ORIGIN: "https://hilera.example.test",
  HILERA_AUTH_CSRF_SECRET: Buffer.alloc(32, 1).toString("base64url"), HILERA_AUTH_THROTTLE_SECRET: Buffer.alloc(32, 2).toString("base64url") });
const principal = { sessionId: "synthetic-session", userId: "synthetic-user" };

describe("email security server actions", () => {
  afterEach(() => vi.unstubAllEnvs());
  beforeEach(() => {
    vi.resetAllMocks();
    vi.stubEnv("HILERA_AUTH_EMAIL_CODE_SECRET", Buffer.alloc(32, 3).toString("base64url"));
    vi.mocked(headers).mockResolvedValue(new Headers({ origin: config.trustedOrigin }));
    vi.mocked(getAuthConfig).mockReturnValue(config);
    vi.mocked(getCurrentSession).mockResolvedValue(principal);
    vi.mocked(getAuthDb).mockReturnValue({} as AuthDb);
    vi.mocked(configuredEmailDelivery).mockReturnValue({ send: async () => {} });
  });

  it("returns the same generic recovery acknowledgement on different accounts and delivery errors", async () => {
    const first = new FormData(); first.set("email", "First@example.test");
    const second = new FormData(); second.set("email", "missing@example.test");
    const firstResult = await requestRecovery(null, first);
    vi.mocked(requestEmailChallenge).mockRejectedValueOnce(new Error("synthetic sensitive detail"));
    const secondResult = await requestRecovery(null, second);
    expect(firstResult).toEqual(secondResult);
    expect(JSON.stringify(secondResult)).not.toContain("synthetic sensitive detail");
    vi.mocked(configuredEmailDelivery).mockReturnValueOnce(null);
    expect(await requestRecovery(null, second)).toEqual(firstResult);
  });

  it("rejects foreign origin, absent session and invalid CSRF before verification", async () => {
    const form = new FormData(); form.set("csrf", issueSessionCsrf(principal.sessionId, config.csrfSecret));
    vi.mocked(headers).mockResolvedValueOnce(new Headers({ origin: "https://foreign.example.test" }));
    expect(await requestVerification(null, form)).toMatchObject({ error: true });
    vi.mocked(getCurrentSession).mockResolvedValueOnce(null);
    expect(await requestVerification(null, form)).toMatchObject({ error: true });
    form.set("csrf", "invalid");
    expect(await requestVerification(null, form)).toMatchObject({ error: true });
    form.set("code", "synthetic");
    expect(await completeVerification(null, form)).toMatchObject({ error: true });
    expect(requestEmailChallenge).not.toHaveBeenCalled();
    expect(verifyRegisteredEmail).not.toHaveBeenCalled();
  });

  it("rejects a foreign-origin recovery request before admission or delivery", async () => {
    vi.mocked(headers).mockResolvedValueOnce(new Headers({ origin: "https://foreign.example.test" }));
    const form = new FormData(); form.set("email", "synthetic@example.test");
    expect(await requestRecovery(null, form)).toMatchObject({ error: true });
    expect(requestEmailChallenge).not.toHaveBeenCalled();
  });

  it("fails closed when the challenge secret is missing or reuses an auth secret", async () => {
    const form = new FormData(); form.set("csrf", issueSessionCsrf(principal.sessionId, config.csrfSecret));
    vi.stubEnv("HILERA_AUTH_EMAIL_CODE_SECRET", "");
    expect(await requestVerification(null, form)).toMatchObject({ error: true });
    vi.stubEnv("HILERA_AUTH_EMAIL_CODE_SECRET", Buffer.from(config.csrfSecret).toString("base64url"));
    expect(await requestVerification(null, form)).toMatchObject({ error: true });
    expect(requestEmailChallenge).not.toHaveBeenCalled();
  });

  it("explains password validation without looking up an account", async () => {
    const form = new FormData();
    form.set("email", "synthetic@example.test"); form.set("code", "synthetic");
    form.set("password", "short"); form.set("confirmPassword", "short");
    expect(await completeRecovery(null, form)).toMatchObject({ message: "Use a password between 15 and 128 characters.", error: true });
    expect(getAuthDb).not.toHaveBeenCalled();
  });
});
