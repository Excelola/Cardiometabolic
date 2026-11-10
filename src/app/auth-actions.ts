"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

import { getAuthConfig } from "@/server/auth/config";
import { authenticateAccount, createAccount } from "@/server/auth/credentials";
import { normalizeEmail, readAuthForm } from "@/server/auth/input";
import { isTrustedAuthOrigin, verifySessionCsrf } from "@/server/auth/mutation-security";
import { isPasswordInputBounded, validateNewPassword } from "@/server/auth/password";
import { sessionCookieName, sessionCookieOptions } from "@/server/auth/request-session";
import { findActiveSession, revokeCurrentSession } from "@/server/auth/sessions";
import { getAuthDb } from "@/server/db/auth-db";

export type AuthActionState = Readonly<{ error: string }> | null;

const unavailable = { error: "Account access is temporarily unavailable. Please try again." };
const invalidCredentials = { error: "Email address or password is incorrect." };
const invalidOrigin = { error: "This request could not be verified. Reload the page and try again." };

async function submitCredentials(mode: "sign-up" | "sign-in", form: FormData): Promise<AuthActionState> {
  try {
    const config = getAuthConfig();
    if (!isTrustedAuthOrigin(await headers(), config)) return invalidOrigin;

    const values = readAuthForm(form, ["email", "password"]);
    const email = normalizeEmail(values?.email);
    if (!values || !email) return mode === "sign-in" ? invalidCredentials : { error: "Enter a valid email address." };
    const password = values.password;
    if (mode === "sign-up") {
      const policy = validateNewPassword(password);
      if (policy === "length") return { error: "Use a password between 15 and 128 characters." };
      if (policy === "blocked") return { error: "Choose a different password. This one is too commonly used." };
      if (policy === "invalid") return { error: "Choose a password without control characters." };
    } else if (!isPasswordInputBounded(password)) {
      return invalidCredentials;
    }

    const jar = await cookies();
    const name = sessionCookieName(config);
    const input = { email, password, previousToken: jar.get(name)?.value };
    const operation = mode === "sign-up" ? createAccount : authenticateAccount;
    const result = await operation(getAuthDb(), config, input);
    switch (result.kind) {
      case "invalid_credentials": return invalidCredentials;
      case "registration_failed": return { error: "We couldn't create an account with those details." };
      case "throttled": return { error: "Too many attempts. Wait a moment and try again." };
      case "unavailable": return unavailable;
      case "success": jar.set(name, result.token, sessionCookieOptions(config)); break;
    }
  } catch {
    // Never serialize or log the request, database error, credential or bearer.
    return unavailable;
  }
  redirect(mode === "sign-up" ? "/onboarding" : "/app/dashboard");
}

export async function signUp(_previous: AuthActionState, form: FormData): Promise<AuthActionState> {
  return submitCredentials("sign-up", form);
}

export async function signIn(_previous: AuthActionState, form: FormData): Promise<AuthActionState> {
  return submitCredentials("sign-in", form);
}

export async function signOut(_previous: AuthActionState, form: FormData): Promise<AuthActionState> {
  try {
    const config = getAuthConfig();
    if (!isTrustedAuthOrigin(await headers(), config)) return invalidOrigin;
    const values = readAuthForm(form, ["csrf"]);
    if (!values) return invalidOrigin;

    const jar = await cookies();
    const name = sessionCookieName(config);
    const bearer = jar.get(name)?.value;
    if (bearer) {
      const db = getAuthDb();
      const principal = await findActiveSession(db, bearer);
      if (principal) {
        if (!verifySessionCsrf(principal.sessionId, values.csrf, config.csrfSecret)) return invalidOrigin;
        await revokeCurrentSession(db, principal);
      }
    }
    jar.set(name, "", { ...sessionCookieOptions(config), maxAge: 0 });
  } catch {
    return { error: "We couldn't sign you out. Please try again." };
  }
  redirect("/sign-in");
}
