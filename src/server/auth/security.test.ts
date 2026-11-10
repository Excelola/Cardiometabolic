import { describe, expect, it, vi } from "vitest";

import { getAuthDb } from "../db/auth-db";
import { readAuthConfig } from "./config";
import { normalizeEmail, readAuthForm } from "./input";
import { isTrustedAuthOrigin, issueSessionCsrf, verifySessionCsrf } from "./mutation-security";
import { sessionCookieName, sessionCookieOptions } from "./request-session";
import { newSessionToken, sessionDigest } from "./sessions";
import { nextIdentityDelay } from "./throttle";

const testEnv = {
  NODE_ENV: "test",
  HILERA_AUTH_CSRF_SECRET: Buffer.alloc(32, 1).toString("base64url"),
  HILERA_AUTH_THROTTLE_SECRET: Buffer.alloc(32, 2).toString("base64url"),
};

describe("authentication input and request boundary", () => {
  it("canonicalizes domains but preserves local part, dots and plus aliases", () => {
    expect(normalizeEmail(" Name.Part+test@EXAMPLE.COM ")).toBe("Name.Part+test@example.com");
    for (const value of ["bad", "bad@@example.com", "bad..dots@example.com", "name@-example.com", "user@localhost", "é@example.com"]) {
      expect(normalizeEmail(value)).toBeNull();
    }
  });

  it("rejects unexpected, missing, repeated and non-string fields", () => {
    const form = new FormData();
    form.set("email", "test@example.com");
    form.set("$ACTION_ID_synthetic", "");
    expect(readAuthForm(form, ["email", "password"])).toBeNull();
    form.set("password", "synthetic value");
    expect(readAuthForm(form, ["email", "password"])).toMatchObject({ email: "test@example.com", password: "synthetic value" });
    form.append("password", "second value");
    expect(readAuthForm(form, ["email", "password"])).toBeNull();
    form.set("password", new Blob(["test"]));
    expect(readAuthForm(form, ["email", "password"])).toBeNull();
    form.set("password", "synthetic value");
    form.set("userId", "client-asserted");
    expect(readAuthForm(form, ["email", "password"])).toBeNull();
  });

  it("uses exact origin and only falls back to an exact Referer origin when Origin is absent", () => {
    const cfg = { trustedOrigin: "https://test.example" };
    expect(isTrustedAuthOrigin(new Headers({ origin: cfg.trustedOrigin }), cfg)).toBe(true);
    expect(isTrustedAuthOrigin(new Headers({ referer: `${cfg.trustedOrigin}/sign-in` }), cfg)).toBe(true);
    for (const origin of ["null", "", "https://sibling.test.example", "http://test.example", "https://test.example:8443", "https://test.example/path"]) {
      expect(isTrustedAuthOrigin(new Headers({ origin, referer: cfg.trustedOrigin }), cfg)).toBe(false);
    }
    for (const referer of ["https://test.example.evil.test/", "https://test.example@evil.test/", "https:\\test.example", "https://test.example/, https://evil.test/"]) {
      expect(isTrustedAuthOrigin(new Headers({ referer }), cfg)).toBe(false);
    }
    expect(isTrustedAuthOrigin(new Headers({ host: "test.example", "x-forwarded-host": "test.example" }), cfg)).toBe(false);
  });

  it("binds CSRF to the session and validates canonical encoding in constant-time comparison", () => {
    const key = Buffer.alloc(32, 8);
    const token = issueSessionCsrf("session-one", key);
    expect(verifySessionCsrf("session-one", token, key)).toBe(true);
    expect(verifySessionCsrf("session-two", token, key)).toBe(false);
    expect(verifySessionCsrf("session-one", token + "=", key)).toBe(false);
    expect(verifySessionCsrf("session-one", token, Buffer.alloc(32, 9))).toBe(false);
  });
});

describe("session and throttle policy", () => {
  it("issues distinct canonical 256-bit bearers and calculates independent session deadlines", () => {
    const now = new Date("2026-11-10T00:00:00Z");
    const first = newSessionToken(now);
    const second = newSessionToken(now);
    expect(first.token).not.toBe(second.token);
    expect(first.tokenHash).toHaveLength(32);
    expect(sessionDigest(first.token)).toEqual(first.tokenHash);
    expect(sessionDigest(first.tokenHash.toString("hex"))).toBeNull();
    expect(sessionDigest(first.token + "=")).toBeNull();
    expect(first.idleExpiresAt.toISOString()).toBe("2026-11-10T01:00:00.000Z");
    expect(first.absoluteExpiresAt.toISOString()).toBe("2026-11-11T00:00:00.000Z");
  });

  it("requires secure deployment origin, independent keys and explicit production limits", () => {
    const values = { ...testEnv, NODE_ENV: "production", HILERA_AUTH_ORIGIN: "https://test.example" };
    expect(() => readAuthConfig(values)).toThrow();
    expect(() => readAuthConfig({ ...testEnv, HILERA_AUTH_ORIGIN: "http://lan.example" })).toThrow();
    expect(() => readAuthConfig({ ...testEnv, HILERA_AUTH_THROTTLE_SECRET: testEnv.HILERA_AUTH_CSRF_SECRET })).toThrow();
    const prod = readAuthConfig({ ...values, HILERA_AUTH_GLOBAL_LIMIT: "40", HILERA_AUTH_GLOBAL_WINDOW_MS: "60000",
      HILERA_AUTH_IDENTITY_LIMIT: "4", HILERA_AUTH_IDENTITY_WINDOW_MS: "600000", HILERA_AUTH_MAX_DELAY_MS: "60000" });
    expect(sessionCookieName(prod)).toBe("__Host-hilera_session");
    expect(sessionCookieOptions(prod)).toEqual({ httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 86400 });
    expect(sessionCookieName(readAuthConfig(testEnv))).toBe("hilera_session_dev");
  });

  it("uses a bounded progressive cooldown without extending the fixed window", () => {
    const { throttle } = readAuthConfig(testEnv);
    expect([5, 6, 7, 8, 10000].map((count) => nextIdentityDelay(count, throttle))).toEqual([0, 1000, 2000, 4000, 60000]);
  });

  it("rejects missing or ambiguous production database TLS configuration before connecting", () => {
    vi.stubEnv("NODE_ENV", "production");
    try {
      const fixture = "postgresql://synthetic@invalid.test/synthetic";
      vi.stubEnv("DATABASE_URL", fixture);
      expect(() => getAuthDb()).toThrow("requires verified TLS");
      vi.stubEnv("DATABASE_URL", fixture + "?sslmode=verify-full&sslmode=disable");
      expect(() => getAuthDb()).toThrow("requires verified TLS");
    } finally {
      vi.unstubAllEnvs();
    }
  });
});
