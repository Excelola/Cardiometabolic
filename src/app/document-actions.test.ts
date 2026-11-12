import { headers } from "next/headers";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getAuthConfig, readAuthConfig } from "@/server/auth/config";
import { issueSessionCsrf } from "@/server/auth/mutation-security";
import { getCurrentSession } from "@/server/auth/request-session";
import { getAuthDb, type AuthDb } from "@/server/db/auth-db";
import { confirmDocumentUpload } from "@/server/documents/service";
import { confirmHealthDocumentAction } from "./document-actions";

vi.mock("next/headers", () => ({ headers: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("@/server/auth/config", async (original) => ({ ...await original<typeof import("@/server/auth/config")>(), getAuthConfig: vi.fn() }));
vi.mock("@/server/auth/request-session", () => ({ getCurrentSession: vi.fn() }));
vi.mock("@/server/db/auth-db", () => ({ getAuthDb: vi.fn() }));
vi.mock("@/server/documents/service", () => ({ confirmDocumentUpload: vi.fn(), cancelDocumentUpload: vi.fn() }));

const config = readAuthConfig({ NODE_ENV: "test", HILERA_AUTH_ORIGIN: "https://hilera.example.test",
  HILERA_AUTH_CSRF_SECRET: Buffer.alloc(32, 21).toString("base64url"),
  HILERA_AUTH_THROTTLE_SECRET: Buffer.alloc(32, 22).toString("base64url") });
const principal = { sessionId: "synthetic-document-session", userId: "synthetic-document-owner" };
const db = {} as AuthDb;
const uploadId = "197a1943-5a8b-4dfa-981c-c7a3932e4f33";

describe("document mutation security", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(headers).mockResolvedValue(new Headers({ origin: config.trustedOrigin }));
    vi.mocked(getAuthConfig).mockReturnValue(config);
    vi.mocked(getCurrentSession).mockResolvedValue(principal);
    vi.mocked(getAuthDb).mockReturnValue(db);
  });

  it("protects confirmation and hides internal errors", async () => {
    const form = new FormData(); form.set("csrf", issueSessionCsrf(principal.sessionId, config.csrfSecret)); form.set("uploadId", uploadId);
    vi.mocked(confirmDocumentUpload).mockRejectedValueOnce(new Error("SQL synthetic canary 907144"));
    const error = await confirmHealthDocumentAction(null, form);
    expect(error).toMatchObject({ error: expect.any(String) });
    expect(JSON.stringify(error)).not.toContain("907144");
    const bad = new FormData(); bad.set("csrf", "bad"); bad.set("uploadId", uploadId);
    expect(await confirmHealthDocumentAction(null, bad)).toMatchObject({ error: expect.any(String) });
    expect(confirmDocumentUpload).toHaveBeenCalledTimes(1);
  });
});
