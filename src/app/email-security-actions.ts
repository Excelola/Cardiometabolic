"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { getAuthConfig } from "@/server/auth/config";
import { configuredEmailDelivery } from "@/server/auth/email-delivery";
import { readChallengeSecret, requestEmailChallenge, resetPasswordWithEmailCode, verifyRegisteredEmail } from "@/server/auth/email-challenge-service";
import { normalizeEmail, readAuthForm } from "@/server/auth/input";
import { isTrustedAuthOrigin, verifySessionCsrf } from "@/server/auth/mutation-security";
import { validateNewPassword } from "@/server/auth/password";
import { getCurrentSession } from "@/server/auth/request-session";
import { getAuthDb } from "@/server/db/auth-db";

export type EmailSecurityState = Readonly<{ message: string; error?: boolean }> | null;
const unavailable = { message: "Email verification is unavailable right now. Please try again later.", error: true };
const invalid = { message: "We couldn’t verify this request. Reload the page and try again.", error: true };
const genericRequest = { message: "If the account is eligible, recovery instructions will be sent." };

async function minimumResponseDelay(started: number): Promise<void> {
  // Limits easy timing differences; it does not replace production load testing.
  await new Promise((resolve) => setTimeout(resolve, Math.max(0, 750 - (performance.now() - started))));
}

function challengeConfig() {
  const auth = getAuthConfig();
  const codeSecret = readChallengeSecret(process.env.HILERA_AUTH_EMAIL_CODE_SECRET);
  if (!codeSecret || codeSecret.equals(auth.csrfSecret) || codeSecret.equals(auth.throttleSecret)) return null;
  return { codeSecret, throttleSecret: auth.throttleSecret, sender: configuredEmailDelivery() };
}

export async function requestVerification(_previous: EmailSecurityState, form: FormData): Promise<EmailSecurityState> {
  try {
    const auth = getAuthConfig();
    if (!isTrustedAuthOrigin(await headers(), auth)) return invalid;
    const principal = await getCurrentSession();
    const fields = readAuthForm(form, ["csrf"]);
    if (!principal || !fields || !verifySessionCsrf(principal.sessionId, fields.csrf, auth.csrfSecret)) return invalid;
    const config = challengeConfig();
    if (!config?.sender) return unavailable;
    await requestEmailChallenge(getAuthDb(), config, "verify_email", { userId: principal.userId });
    return { message: "If verification is needed, a code will be sent to your registered email." };
  } catch { return unavailable; }
}

export async function completeVerification(_previous: EmailSecurityState, form: FormData): Promise<EmailSecurityState> {
  let success = false;
  try {
    const auth = getAuthConfig();
    if (!isTrustedAuthOrigin(await headers(), auth)) return invalid;
    const principal = await getCurrentSession();
    const fields = readAuthForm(form, ["csrf", "code"]);
    if (!principal || !fields || !verifySessionCsrf(principal.sessionId, fields.csrf, auth.csrfSecret)) return invalid;
    const config = challengeConfig();
    if (!config?.sender) return unavailable;
    success = await verifyRegisteredEmail(getAuthDb(), config, principal.userId, fields.code);
    if (!success) return { message: "This code is invalid or expired. Request a new code and try again.", error: true };
  } catch { return unavailable; }
  redirect("/app/verify-email");
}

export async function requestRecovery(_previous: EmailSecurityState, form: FormData): Promise<EmailSecurityState> {
  try {
    const auth = getAuthConfig();
    if (!isTrustedAuthOrigin(await headers(), auth)) return invalid;
    const fields = readAuthForm(form, ["email"]);
    const email = normalizeEmail(fields?.email);
    if (!fields || !email) return { message: "Enter a valid email address.", error: true };
    const config = challengeConfig();
    if (config?.sender) {
      const started = performance.now();
      try { await requestEmailChallenge(getAuthDb(), config, "reset_password", { email }); }
      finally { await minimumResponseDelay(started); }
    }
  } catch { /* Keep the same public response for all account and provider states. */ }
  return genericRequest;
}

export async function completeRecovery(_previous: EmailSecurityState, form: FormData): Promise<EmailSecurityState> {
  try {
    const auth = getAuthConfig();
    if (!isTrustedAuthOrigin(await headers(), auth)) return invalid;
    const fields = readAuthForm(form, ["email", "code", "password", "confirmPassword"]);
    if (!fields || fields.password !== fields.confirmPassword) return { message: "Check the email, code and matching passwords.", error: true };
    const passwordState = validateNewPassword(fields.password);
    if (passwordState === "length") return { message: "Use a password between 15 and 128 characters.", error: true };
    if (passwordState === "blocked") return { message: "Choose a different password. This one is too commonly used.", error: true };
    if (passwordState === "invalid") return { message: "Choose a password without control characters.", error: true };
    const config = challengeConfig();
    if (!config?.sender) return { message: "We couldn’t reset the password. Check your details or request a new code.", error: true };
    const started = performance.now();
    let success = false;
    try { success = await resetPasswordWithEmailCode(getAuthDb(), config, fields.email, fields.code, fields.password); }
    finally { await minimumResponseDelay(started); }
    if (!success)
      return { message: "We couldn’t reset the password. Check your details or request a new code.", error: true };
  } catch { return { message: "We couldn’t reset the password. Check your details or request a new code.", error: true }; }
  redirect("/sign-in?reset=complete");
}
