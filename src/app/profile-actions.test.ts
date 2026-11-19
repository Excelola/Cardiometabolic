import { headers } from "next/headers";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getAuthConfig, readAuthConfig } from "@/server/auth/config";
import { issueSessionCsrf } from "@/server/auth/mutation-security";
import { getCurrentSession } from "@/server/auth/request-session";
import { getAuthDb, type AuthDb } from "@/server/db/auth-db";
import { saveProfile } from "@/server/profile/repository";
import { saveProfileAction } from "./profile-actions";

vi.mock("next/headers", () => ({ headers: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/server/auth/config", async (original) => ({ ...await original<typeof import("@/server/auth/config")>(), getAuthConfig: vi.fn() }));
vi.mock("@/server/auth/request-session", () => ({ getCurrentSession: vi.fn() }));
vi.mock("@/server/db/auth-db", () => ({ getAuthDb: vi.fn() }));
vi.mock("@/server/profile/repository", () => ({ saveProfile: vi.fn() }));
const config = readAuthConfig({ NODE_ENV: "test", HILERA_AUTH_ORIGIN: "https://hilera.example.test",
  HILERA_AUTH_CSRF_SECRET: Buffer.alloc(32, 1).toString("base64url"), HILERA_AUTH_THROTTLE_SECRET: Buffer.alloc(32, 2).toString("base64url") });
const principal = { sessionId: "session-a", userId: "owner-a" };
function form() {
  const value = new FormData();
  for (const [key, field] of Object.entries({ csrf: issueSessionCsrf(principal.sessionId, config.csrfSecret), intent: "later", preferredName: "Ada", dateOfBirth: "", market: "" })) value.set(key, field);
  return value;
}
describe("profile action ownership", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(headers).mockResolvedValue(new Headers({ origin: config.trustedOrigin }));
    vi.mocked(getAuthConfig).mockReturnValue(config);
    vi.mocked(getCurrentSession).mockResolvedValue(principal);
    vi.mocked(getAuthDb).mockReturnValue({} as AuthDb);
  });
  it("uses the authenticated owner and rejects a supplied foreign owner", async () => {
    await saveProfileAction(null, form());
    expect(saveProfile).toHaveBeenCalledWith(expect.anything(), principal.userId, expect.objectContaining({ preferredName: "Ada" }));
    vi.mocked(saveProfile).mockClear();
    const malicious = form(); malicious.set("userId", "owner-b");
    expect(await saveProfileAction(null, malicious)).toMatchObject({ error: expect.any(String) });
    expect(saveProfile).not.toHaveBeenCalled();
  });
  it("rejects another session's CSRF and a foreign origin", async () => {
    const foreign = form(); foreign.set("csrf", issueSessionCsrf("session-b", config.csrfSecret));
    expect(await saveProfileAction(null, foreign)).toMatchObject({ error: expect.any(String) });
    vi.mocked(headers).mockResolvedValueOnce(new Headers({ origin: "https://foreign.example.test" }));
    expect(await saveProfileAction(null, form())).toMatchObject({ error: expect.any(String) });
    expect(saveProfile).not.toHaveBeenCalled();
  });
});
