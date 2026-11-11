import { beforeEach, describe, expect, it, vi } from "vitest";

import { getAuthConfig, readAuthConfig } from "@/server/auth/config";
import { issueSessionCsrf } from "@/server/auth/mutation-security";
import { getCurrentSession } from "@/server/auth/request-session";
import { getAuthDb, type AuthDb } from "@/server/db/auth-db";
import { developmentProviders } from "@/server/documents/providers";
import { processDocumentUpload } from "@/server/documents/service";
import { POST } from "./route";

vi.mock("@/server/auth/config", async (original) => ({ ...await original<typeof import("@/server/auth/config")>(), getAuthConfig: vi.fn() }));
vi.mock("@/server/auth/request-session", () => ({ getCurrentSession: vi.fn() }));
vi.mock("@/server/db/auth-db", () => ({ getAuthDb: vi.fn() }));
vi.mock("@/server/documents/providers", () => ({ developmentProviders: vi.fn() }));
vi.mock("@/server/documents/service", () => ({ processDocumentUpload: vi.fn() }));

const config = readAuthConfig({ NODE_ENV: "test", HILERA_AUTH_ORIGIN: "https://hilera.example.test",
  HILERA_AUTH_CSRF_SECRET: Buffer.alloc(32, 21).toString("base64url"),
  HILERA_AUTH_THROTTLE_SECRET: Buffer.alloc(32, 22).toString("base64url") });
const principal = { sessionId: "synthetic-document-session", userId: "synthetic-document-owner" };
const db = {} as AuthDb;
const uploadId = "197a1943-5a8b-4dfa-981c-c7a3932e4f33";

function request(options: { origin?: string; csrf?: string; extra?: boolean; size?: number; files?: number } = {}) {
  const form = new FormData();
  for (let index = 0; index < (options.files ?? 1); index++)
    form.append("file", new File([new Uint8Array(options.size ?? 9)], "synthetic.pdf", { type: "application/pdf" }));
  if (options.extra) form.set("ownerUserId", "synthetic-other");
  return new Request(`${config.trustedOrigin}/api/health-documents`, {
    method: "POST",
    headers: { origin: options.origin ?? config.trustedOrigin,
      "x-hilera-csrf": options.csrf ?? issueSessionCsrf(principal.sessionId, config.csrfSecret) },
    body: form,
  });
}

describe("bounded health-document upload endpoint", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(getAuthConfig).mockReturnValue(config);
    vi.mocked(getCurrentSession).mockResolvedValue(principal);
    vi.mocked(getAuthDb).mockReturnValue(db);
    vi.mocked(developmentProviders).mockReturnValue({ scanner: { scan: async () => "clean" }, ocr: { extract: async () => ({ pages: [] }) } });
    vi.mocked(processDocumentUpload).mockResolvedValue({ id: uploadId, status: "review" });
  });

  it("rejects foreign origin, absent session, invalid CSRF and owner injection", async () => {
    expect((await POST(request({ origin: "https://foreign.example.test" }))).status).toBe(403);
    vi.mocked(getCurrentSession).mockResolvedValueOnce(null);
    expect((await POST(request())).status).toBe(403);
    expect((await POST(request({ csrf: "invalid" }))).status).toBe(403);
    expect((await POST(request({ extra: true }))).status).toBe(400);
    expect(processDocumentUpload).not.toHaveBeenCalled();
  });

  it("derives owner from session and fails closed without approved providers", async () => {
    vi.mocked(developmentProviders).mockReturnValueOnce(null);
    expect((await POST(request())).status).toBe(503);
    expect(processDocumentUpload).not.toHaveBeenCalled();
    const response = await POST(request());
    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ id: uploadId });
    expect(processDocumentUpload).toHaveBeenCalledWith(db, principal.userId, expect.any(File), expect.any(Object), expect.any(Object));
  });

  it("enforces one file and request-size cap before processing", async () => {
    expect((await POST(request({ files: 2 }))).status).toBe(400);
    expect((await POST(request({ size: 10 * 1024 * 1024 + 1 }))).status).toBe(413);
    expect(processDocumentUpload).not.toHaveBeenCalled();
  });

  it("returns safe failures without raw provider errors", async () => {
    vi.mocked(processDocumentUpload).mockRejectedValueOnce(new Error("synthetic health canary 907144"));
    const response = await POST(request());
    expect(response.status).toBe(503);
    expect(JSON.stringify(await response.json())).not.toContain("907144");
  });
});
