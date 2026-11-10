import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

import { getAuthDb } from "../db/auth-db";
import { getAuthConfig, type AuthConfig } from "./config";
import { ABSOLUTE_SESSION_MS, findActiveSession, type SessionPrincipal } from "./sessions";

export function sessionCookieOptions(config: Pick<AuthConfig, "secureCookies">) {
  return { httpOnly: true, secure: config.secureCookies, sameSite: "lax", path: "/", maxAge: ABSOLUTE_SESSION_MS / 1000 } as const;
}

export function sessionCookieName(config: Pick<AuthConfig, "secureCookies">): string {
  return config.secureCookies ? "__Host-hilera_session" : "hilera_session_dev";
}

export const getCurrentSession = cache(async (): Promise<SessionPrincipal | null> => {
  try {
    const jar = await cookies();
    const config = getAuthConfig();
    const bearer = jar.get(sessionCookieName(config))?.value;
    return bearer ? await findActiveSession(getAuthDb(), bearer) : null;
  } catch {
    // Missing config, invalid sessions and storage failures all fail closed.
    return null;
  }
});

export async function requireSession(): Promise<SessionPrincipal> {
  const session = await getCurrentSession();
  if (!session) redirect("/sign-in");
  return session;
}
