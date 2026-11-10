import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

import type { AuthConfig } from "./config";

export function isTrustedAuthOrigin(headers: Pick<Headers, "get">, config: Pick<AuthConfig, "trustedOrigin">): boolean {
  const origin = headers.get("origin");
  if (origin !== null) return origin === config.trustedOrigin;

  const referer = headers.get("referer");
  if (!referer || !/^https?:\/\//.test(referer) || /[\s,\\]/u.test(referer)
    || [...referer].some((character) => character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127)) return false;
  const parsed = URL.parse(referer);
  return parsed !== null && !parsed.username && !parsed.password && parsed.origin === config.trustedOrigin;
}

export function issueSessionCsrf(sessionId: string, secret: Uint8Array): string {
  return createHmac("sha256", secret).update("hilera:session-csrf:v1\0").update(sessionId).digest("base64url");
}

export function verifySessionCsrf(sessionId: string, token: unknown, secret: Uint8Array): boolean {
  if (typeof token !== "string" || !/^[A-Za-z0-9_-]{43}$/.test(token)) return false;
  return timingSafeEqual(Buffer.from(token), Buffer.from(issueSessionCsrf(sessionId, secret)));
}
