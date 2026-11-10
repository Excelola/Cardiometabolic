import { headers } from "next/headers";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { readAuthConfig, getAuthConfig } from "@/server/auth/config";
import { issueSessionCsrf } from "@/server/auth/mutation-security";
import { getCurrentSession } from "@/server/auth/request-session";
import { getAuthDb, type AuthDb } from "@/server/db/auth-db";
import { correctHealthRecord, createHealthRecord } from "@/server/health/repository";
import { correctHealthRecordAction, createHealthRecordAction } from "./health-actions";

vi.mock("next/headers", () => ({ headers: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("@/server/auth/config", async (original) => ({ ...await original<typeof import("@/server/auth/config")>(), getAuthConfig: vi.fn() }));
vi.mock("@/server/auth/request-session", () => ({ getCurrentSession: vi.fn() }));
vi.mock("@/server/db/auth-db", () => ({ getAuthDb: vi.fn() }));
vi.mock("@/server/health/repository", () => ({ correctHealthRecord: vi.fn(), createHealthRecord: vi.fn() }));

const config = readAuthConfig({
  NODE_ENV: "test", HILERA_AUTH_ORIGIN: "https://hilera.example.test",
  HILERA_AUTH_CSRF_SECRET: Buffer.alloc(32, 14).toString("base64url"),
  HILERA_AUTH_THROTTLE_SECRET: Buffer.alloc(32, 15).toString("base64url"),
});
const principal = { sessionId: "synthetic-session", userId: "synthetic-owner" };
const db = {} as AuthDb;
const recordId = "197a1943-5a8b-4dfa-981c-c7a3932e4f33";
const canary = "907144.0239";

function fixture() {
  const form = new FormData();
  for (const [name, value] of Object.entries({
    csrf: issueSessionCsrf(principal.sessionId, config.csrfSecret),
    type: "weight", occurredAt: "2026-10-15T03:04", unit: "kg", value: canary,
  })) form.set(name, value);
  return form;
}

describe("manual health mutation boundary", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(headers).mockResolvedValue(new Headers({ origin: config.trustedOrigin }));
    vi.mocked(getAuthConfig).mockReturnValue(config);
    vi.mocked(getCurrentSession).mockResolvedValue(principal);
    vi.mocked(getAuthDb).mockReturnValue(db);
    vi.mocked(createHealthRecord).mockResolvedValue(recordId);
  });

  it("uses the session owner and rejects injected ownership fields before a write", async () => {
    const form = fixture();
    form.set("userId", "synthetic-other");
    expect(await createHealthRecordAction(null, form)).toMatchObject({ error: expect.any(String) });
    expect(getAuthDb).not.toHaveBeenCalled();
    form.delete("userId");
    await createHealthRecordAction(null, form);
    expect(createHealthRecord).toHaveBeenCalledExactlyOnceWith(db, principal.userId,
      { type: "weight", occurredAt: "2026-10-15T03:04:00.000Z", unit: "kg", value: canary });
  });

  it("fails closed for a foreign origin, a missing session, and a CSRF proof from another session", async () => {
    vi.mocked(headers).mockResolvedValueOnce(new Headers({ origin: "https://foreign.example.test" }));
    expect(await createHealthRecordAction(null, fixture())).toMatchObject({ error: expect.any(String) });
    vi.mocked(getCurrentSession).mockResolvedValueOnce(null);
    expect(await createHealthRecordAction(null, fixture())).toMatchObject({ error: expect.any(String) });
    const form = fixture();
    form.set("csrf", issueSessionCsrf("another-session", config.csrfSecret));
    expect(await createHealthRecordAction(null, form)).toMatchObject({ error: expect.any(String) });
    expect(getAuthDb).not.toHaveBeenCalled();
  });

  it("returns the same public error for a missing, foreign, or superseded record", async () => {
    const form = fixture();
    form.set("recordId", recordId);
    vi.mocked(correctHealthRecord).mockResolvedValue(null);
    const unavailable = await correctHealthRecordAction(null, form);
    expect(correctHealthRecord).toHaveBeenCalledWith(db, principal.userId, recordId, expect.any(Object));
    form.set("recordId", "invalid");
    expect(await correctHealthRecordAction(null, form)).toEqual(unavailable);
    expect(JSON.stringify(unavailable)).not.toContain(canary);
  });

  it("returns a public-safe error if persistence fails", async () => {
    vi.mocked(createHealthRecord).mockRejectedValue(new Error(`SQL parameters: ${canary}`));
    const result = await createHealthRecordAction(null, fixture());
    expect(result).toEqual({ error: "We couldn’t save this entry. Please try again." });
    expect(JSON.stringify(result)).not.toContain(canary);
  });
});
