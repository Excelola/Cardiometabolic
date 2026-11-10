import "server-only";

const developmentThrottle = {
  globalLimit: 60,
  globalWindowMs: 60_000,
  identityLimit: 5,
  identityWindowMs: 600_000,
  maxDelayMs: 60_000,
} as const;

export type AuthThrottlePolicy = { [Key in keyof typeof developmentThrottle]: number };

function secret(value: string | undefined): Buffer {
  if (!value || !/^[A-Za-z0-9_-]{43}$/.test(value)) throw new Error("Authentication key is not configured.");
  const decoded = Buffer.from(value, "base64url");
  if (decoded.length !== 32 || decoded.toString("base64url") !== value) {
    throw new Error("Invalid authentication key encoding.");
  }
  return decoded;
}

function numberSetting(value: string | undefined, fallback: number | undefined, min: number, max: number): number {
  if (!value && fallback !== undefined) return fallback;
  const parsed = value && /^[1-9]\d{0,8}$/.test(value) ? Number(value) : NaN;
  if (!Number.isSafeInteger(parsed) || parsed < min || parsed > max) throw new Error("Invalid authentication throttle configuration.");
  return parsed;
}

export function readAuthConfig(env: Readonly<Record<string, string | undefined>>) {
  const production = env.NODE_ENV === "production";
  const origin = env.HILERA_AUTH_ORIGIN || (production ? "" : "http://localhost:3011");
  const parsed = URL.parse(origin);
  const secureCookies = parsed?.protocol === "https:";
  const loopback = parsed && ["localhost", "127.0.0.1", "[::1]"].includes(parsed.hostname);
  if (!parsed || parsed.origin !== origin || (!secureCookies && (production || parsed.protocol !== "http:" || !loopback))) {
    throw new Error("Authentication requires an exact trusted HTTPS origin, or loopback HTTP in development.");
  }

  const csrfSecret = secret(env.HILERA_AUTH_CSRF_SECRET);
  const throttleSecret = secret(env.HILERA_AUTH_THROTTLE_SECRET);
  if (csrfSecret.equals(throttleSecret)) throw new Error("Authentication keys must be distinct.");

  const defaults = production ? undefined : developmentThrottle;
  const throttle: AuthThrottlePolicy = {
    globalLimit: numberSetting(env.HILERA_AUTH_GLOBAL_LIMIT, defaults?.globalLimit, 1, 32767),
    globalWindowMs: numberSetting(env.HILERA_AUTH_GLOBAL_WINDOW_MS, defaults?.globalWindowMs, 1000, 900_000),
    identityLimit: numberSetting(env.HILERA_AUTH_IDENTITY_LIMIT, defaults?.identityLimit, 1, 16384),
    identityWindowMs: numberSetting(env.HILERA_AUTH_IDENTITY_WINDOW_MS, defaults?.identityWindowMs, 1000, 900_000),
    maxDelayMs: numberSetting(env.HILERA_AUTH_MAX_DELAY_MS, defaults?.maxDelayMs, 1000, 120_000),
  };
  if (throttle.maxDelayMs > throttle.identityWindowMs) throw new Error("Authentication cooldown exceeds its window.");
  return { trustedOrigin: parsed.origin, secureCookies, csrfSecret, throttleSecret, throttle };
}

export type AuthConfig = ReturnType<typeof readAuthConfig>;

export function getAuthConfig(): AuthConfig {
  return readAuthConfig(process.env);
}
