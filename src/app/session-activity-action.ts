"use server";

import { cookies, headers } from "next/headers";

import { getAuthConfig } from "@/server/auth/config";
import { isTrustedAuthOrigin, verifySessionCsrf } from "@/server/auth/mutation-security";
import { sessionCookieName } from "@/server/auth/request-session";
import { findActiveSession, renewSessionActivity } from "@/server/auth/sessions";
import { getAuthDb } from "@/server/db/auth-db";

export async function recordSessionActivity(csrf: unknown): Promise<void> {
  if (typeof csrf !== "string" || !/^[A-Za-z0-9_-]{43}$/.test(csrf)) return;

  try {
    const request = await headers();
    if (request.has("next-router-prefetch") || request.has("next-router-segment-prefetch")
      || /\b(prefetch|prerender)\b/i.test(request.get("sec-purpose") ?? "")) return;
    const config = getAuthConfig();
    if (!isTrustedAuthOrigin(request, config)) return;

    const jar = await cookies();
    const bearer = jar.get(sessionCookieName(config))?.value;
    if (!bearer) return;

    const db = getAuthDb();
    const principal = await findActiveSession(db, bearer);
    if (!principal || !verifySessionCsrf(principal.sessionId, csrf, config.csrfSecret)) return;

    await renewSessionActivity(db, principal);
  } catch {
    // Activity renewal is best-effort. Authentication still fails closed on the next protected request.
  }
}
