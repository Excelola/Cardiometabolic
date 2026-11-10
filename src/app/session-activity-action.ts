"use server";

import { cookies, headers } from "next/headers";

import { getAuthConfig } from "@/server/auth/config";
import { isTrustedAuthOrigin, verifySessionCsrf } from "@/server/auth/mutation-security";
import { sessionCookieName } from "@/server/auth/request-session";
import { findActiveSession, renewSessionActivity } from "@/server/auth/sessions";
import { getAuthDb } from "@/server/db/auth-db";

export async function recordSessionActivity(csrf: string): Promise<void> {
  try {
    const config = getAuthConfig();
    if (!isTrustedAuthOrigin(await headers(), config)) return;

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
