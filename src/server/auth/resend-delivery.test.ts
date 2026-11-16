import { afterEach, describe, expect, it, vi } from "vitest";

import { configuredEmailDelivery } from "./email-delivery";
import { ResendEmailDelivery } from "./resend-delivery";

const key = "re_synthetic_test_key_only";
const sender = "HILERA <notifications@example.test>";
const code = "ABCdef1234567890_-ABCD";

afterEach(() => vi.unstubAllEnvs());

function acceptedTransport() {
  return vi.fn(async (_url: RequestInfo | URL, _options?: RequestInit) =>
    new Response(JSON.stringify({ id: "synthetic-provider-email-id" }), {
      status: 200, headers: { "Content-Type": "application/json" },
    }));
}

describe("Resend adapter foundation (mock transport only)", () => {
  it("posts a minimal verification message without leaking the proof in URLs or headers", async () => {
    const transport = acceptedTransport();
    const adapter = new ResendEmailDelivery({ apiKey: key, from: sender, transport: transport as unknown as typeof fetch });
    await adapter.send({ email: "fictional@example.test", purpose: "verify_email", code });

    expect(transport).toHaveBeenCalledTimes(1);
    const [url, init] = transport.mock.calls[0];
    expect(String(url)).toBe("https://api.resend.com/emails");
    expect(init?.method).toBe("POST");
    const headers = init?.headers as Record<string, string>;
    expect(headers.Authorization).toBe(`Bearer ${key}`);
    expect(headers["Idempotency-Key"]).toMatch(/^[0-9a-f-]{36}$/);
    expect(JSON.stringify({ url, headers })).not.toContain(code);

    const payload = JSON.parse(String(init?.body)) as Record<string, unknown>;
    expect(payload.from).toBe(sender);
    expect(payload.to).toEqual(["fictional@example.test"]);
    expect(payload.subject).toBe("Verify your HILERA email");
    expect(payload.text).toContain(code);
    expect(payload.html).toContain(code);
    expect(payload.html).not.toContain("<a ");
    expect(String(payload.text)).not.toMatch(/blood pressure|glucose|diagnosis|medical record/i);
  });

  it("uses an account-recovery subject without exposing the code in the subject", async () => {
    const transport = acceptedTransport();
    const adapter = new ResendEmailDelivery({ apiKey: key, from: sender, transport: transport as unknown as typeof fetch });
    await adapter.send({ email: "fictional@example.test", purpose: "reset_password", code });
    const payload = JSON.parse(String(transport.mock.calls[0][1]?.body)) as Record<string, string>;
    expect(payload.subject).toBe("Your HILERA password recovery code");
    expect(payload.subject).not.toContain(code);
    expect(payload.text).toContain("reset your account password");
  });

  it("fails safely for provider quota errors, malformed confirmations, and transport failures", async () => {
    const cases = [
      vi.fn(async (_url: RequestInfo | URL, _options?: RequestInit) => new Response("Quota exhausted", { status: 429 })),
      vi.fn(async (_url: RequestInfo | URL, _options?: RequestInit) => new Response(JSON.stringify({}), { status: 200 })),
      vi.fn(async (_url: RequestInfo | URL, _options?: RequestInit): Promise<Response> => { throw new Error(`Provider response includes ${key} and ${code}`); }),
    ];
    for (const transport of cases) {
      const adapter = new ResendEmailDelivery({ apiKey: key, from: sender, transport: transport as unknown as typeof fetch });
      try {
        await adapter.send({ email: "fictional@example.test", purpose: "verify_email", code });
        throw new Error("Expected a delivery failure");
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe("Email delivery could not be confirmed.");
        expect((error as Error).message).not.toContain(key);
        expect((error as Error).message).not.toContain(code);
      }
    }
  });

  it("refuses unconfigured identities and invalid codes before making requests", async () => {
    const transport = acceptedTransport();
    expect(() => new ResendEmailDelivery({ apiKey: "", from: sender, transport: transport as unknown as typeof fetch })).toThrow("not configured");
    expect(() => new ResendEmailDelivery({ apiKey: key, from: "HILERA\nBcc: other@example.test", transport: transport as unknown as typeof fetch })).toThrow("not configured");
    const adapter = new ResendEmailDelivery({ apiKey: key, from: sender, transport: transport as unknown as typeof fetch });
    await expect(adapter.send({ email: "fictional@example.test", purpose: "verify_email", code: "not-a-code" })).rejects.toThrow("could not be confirmed");
    expect(transport).not.toHaveBeenCalled();
  });

  it("does not activate a real provider merely by setting a Resend environment variable", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("HILERA_SYNTHETIC_EMAIL", "enabled");
    vi.stubEnv("RESEND_API_KEY", key);
    expect(configuredEmailDelivery()).toBeNull();
  });
});
