import { cookies, headers } from "next/headers";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getAuthConfig, readAuthConfig } from "@/server/auth/config";
import { issueSessionCsrf } from "@/server/auth/mutation-security";
import { findActiveSession, renewSessionActivity } from "@/server/auth/sessions";
import { getAuthDb, type AuthDb } from "@/server/db/auth-db";

import { recordSessionActivity } from "./session-activity-action";

vi.mock("next/headers", () => ({ headers: vi.fn(), cookies: vi.fn() }));
vi.mock("@/server/auth/config", async (original) => ({
  ...await original<typeof import("@/server/auth/config")>(),
  getAuthConfig: vi.fn(),
}));
vi.mock("@/server/auth/sessions", () => ({ findActiveSession: vi.fn(), renewSessionActivity: vi.fn() }));
vi.mock("@/server/db/auth-db", () => ({ getAuthDb: vi.fn() }));

const config = readAuthConfig({
  NODE_ENV: "test",
  HILERA_AUTH_ORIGIN: "https://hilera.example.test",
  HILERA_AUTH_CSRF_SECRET: Buffer.alloc(32, 1).toString("base64url"),
  HILERA_AUTH_THROTTLE_SECRET: Buffer.alloc(32, 2).toString("base64url"),
});
const db = {} as AuthDb;
const session = { sessionId: "fixture-session", userId: "fixture-user" };
const bearer = "synthetic-bearer";
const proof = issueSessionCsrf(session.sessionId, config.csrfSecret);
const jar = { get: vi.fn(), set: vi.fn() };

describe("authenticated session activity action", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(getAuthConfig).mockReturnValue(config);
    vi.mocked(headers).mockResolvedValue(new Headers({ origin: config.trustedOrigin }));
    vi.mocked(cookies).mockResolvedValue(jar as unknown as Awaited<ReturnType<typeof cookies>>);
    jar.get.mockReturnValue({ value: bearer });
    vi.mocked(getAuthDb).mockReturnValue(db);
    vi.mocked(findActiveSession).mockResolvedValue(session);
    vi.mocked(renewSessionActivity).mockResolvedValue(true);
  });

  it("renews only the principal resolved from the cookie and leaves the cookie lifetime alone", async () => {
    await recordSessionActivity(proof);
    expect(findActiveSession).toHaveBeenCalledWith(db, bearer);
    expect(renewSessionActivity).toHaveBeenCalledExactlyOnceWith(db, session);
    expect(jar.set).not.toHaveBeenCalled();
  });

  it.each([
    ["next-router-prefetch", "1"],
    ["next-router-segment-prefetch", "/app"],
    ["sec-purpose", "prefetch;prerender"],
    ["origin", "https://other.example.test"],
  ])("does not perform an auth read or write for disallowed %s", async (key, value) => {
    const request = new Headers({ origin: config.trustedOrigin });
    request.set(key, value);
    vi.mocked(headers).mockResolvedValue(request);
    await recordSessionActivity(proof);
    expect(findActiveSession).not.toHaveBeenCalled();
    expect(renewSessionActivity).not.toHaveBeenCalled();
  });

  it("does not renew without an active session or with a proof for another session", async () => {
    vi.mocked(findActiveSession).mockResolvedValueOnce(null);
    await recordSessionActivity(proof);
    await recordSessionActivity(issueSessionCsrf("different-session", config.csrfSecret));
    expect(renewSessionActivity).not.toHaveBeenCalled();
  });

  it("fails closed without issuing a cookie if the renewal store is unavailable", async () => {
    vi.mocked(renewSessionActivity).mockRejectedValue(new Error("synthetic store outage"));
    await expect(recordSessionActivity(proof)).resolves.toBeUndefined();
    expect(jar.set).not.toHaveBeenCalled();
  });
});
