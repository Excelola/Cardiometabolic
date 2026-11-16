import { afterEach, describe, expect, it, vi } from "vitest";

import { configuredEmailDelivery, SyntheticEmailDelivery } from "./email-delivery";

afterEach(() => vi.unstubAllEnvs());

describe("synthetic email delivery", () => {
  it("is available only when explicitly enabled outside production", async () => {
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("HILERA_SYNTHETIC_EMAIL", "enabled");
    expect(configuredEmailDelivery()).not.toBeNull();
    const sink = new SyntheticEmailDelivery();
    await expect(sink.send({ email: "person@other.example", purpose: "verify_email", code: "synthetic" })).rejects.toThrow();
    await sink.send({ email: "person@example.test", purpose: "verify_email", code: "synthetic" });
    expect(sink.take()?.code).toBe("synthetic");
    vi.stubEnv("NODE_ENV", "production");
    expect(configuredEmailDelivery()).toBeNull();
    await expect(sink.send({ email: "person@example.test", purpose: "verify_email", code: "synthetic" })).rejects.toThrow();
  });
});
