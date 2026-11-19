import { afterEach, describe, expect, it, vi } from "vitest";

import { configuredEmailDelivery, SyntheticEmailDelivery, verificationDeliveryStatus } from "./email-delivery";

afterEach(() => vi.unstubAllEnvs());

describe("synthetic email delivery", () => {
  it("is available only when explicitly enabled outside production", async () => {
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("HILERA_SYNTHETIC_EMAIL", "enabled");
    expect(configuredEmailDelivery()).not.toBeNull();
    expect(verificationDeliveryStatus("person@example.test")).toBe("available");
    expect(verificationDeliveryStatus("person@other.example")).toBe("not_authorized");
    const sink = new SyntheticEmailDelivery();
    await expect(sink.send({ email: "person@other.example", purpose: "verify_email", code: "synthetic" })).rejects.toThrow();
    await sink.send({ email: "person@example.test", purpose: "verify_email", code: "synthetic" });
    expect(sink.take()?.code).toBe("synthetic");
    vi.stubEnv("NODE_ENV", "production");
    expect(configuredEmailDelivery()).toBeNull();
    expect(verificationDeliveryStatus("person@example.test")).toBe("not_configured");
    await expect(sink.send({ email: "person@example.test", purpose: "verify_email", code: "synthetic" })).rejects.toThrow();
  });
});
