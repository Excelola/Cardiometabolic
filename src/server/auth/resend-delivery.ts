import "server-only";

import { randomUUID } from "node:crypto";

import { EMAIL_CODE_LIFETIME_MS, type EmailChallengePurpose } from "./email-challenge-code";
import type { EmailDelivery } from "./email-delivery";

const RESEND_EMAILS_ENDPOINT = "https://api.resend.com/emails";
const DEFAULT_TIMEOUT_MS = 8_000;
const CODE_PATTERN = /^[A-Za-z0-9_-]{22}$/;
const RECIPIENT_PATTERN = /^[^\s@]+@[^\s@]+$/;

export type ResendDeliveryOptions = Readonly<{
  /** Must come from server-side secret management when separately activated. */
  apiKey: string;
  /** A verified sending identity, e.g. HILERA <notifications@approved-domain>. */
  from: string;
  /** Injected mock transport in tests. Never supply a real key to tests. */
  transport?: typeof fetch;
  timeoutMs?: number;
}>;

function renderCodeEmail(purpose: EmailChallengePurpose, code: string) {
  const verification = purpose === "verify_email";
  const subject = verification ? "Verify your HILERA email" : "Your HILERA password recovery code";
  const explanation = verification
    ? "Enter this code in HILERA to verify your registered email address."
    : "Enter this code in HILERA to reset your account password.";
  const lifetimeMinutes = EMAIL_CODE_LIFETIME_MS / 60_000;
  const reminder = `This code expires in ${lifetimeMinutes} minutes. If you did not request it, you can ignore this message.`;

  // The proof appears only in message content, never in a link, URL or subject.
  return {
    subject,
    text: `${explanation}\n\n${code}\n\n${reminder}\n\nHILERA Account Security`,
    html: `<!doctype html><html lang="en"><body style="font-family:Arial,sans-serif;color:#183f34;background:#f9f7ef;padding:24px"><main style="max-width:520px;margin:auto"><h1 style="font-size:24px">HILERA</h1><p>${explanation}</p><p style="font-size:24px;font-weight:bold;letter-spacing:2px;overflow-wrap:anywhere">${code}</p><p>${reminder}</p><p>HILERA Account Security</p></main></body></html>`,
  };
}

/**
 * Server-only delivery adapter. The selector restricts it to explicitly
 * enabled non-production test environments and an exact recipient allowlist.
 */
export class ResendEmailDelivery implements EmailDelivery {
  private readonly transport: typeof fetch;
  private readonly timeoutMs: number;

  constructor(private readonly options: ResendDeliveryOptions) {
    if (!options.apiKey.startsWith("re_") || options.apiKey.length < 12) {
      throw new Error("Resend delivery is not configured.");
    }
    if (!/^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+$/.test(options.from) || options.from.length > 254) {
      throw new Error("Resend sender identity is not configured.");
    }
    const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 100 || timeoutMs > 30_000) {
      throw new Error("Invalid Resend request timeout.");
    }
    this.transport = options.transport ?? fetch;
    this.timeoutMs = timeoutMs;
  }

  async send(message: Readonly<{ email: string; purpose: EmailChallengePurpose; code: string }>): Promise<void> {
    if (!RECIPIENT_PATTERN.test(message.email) || !CODE_PATTERN.test(message.code)
      || (message.purpose !== "verify_email" && message.purpose !== "reset_password")) {
      throw new Error("Email delivery could not be confirmed.");
    }

    const email = renderCodeEmail(message.purpose, message.code);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      // Exactly one outbound request. Do not auto-retry an ambiguous timeout.
      // A random idempotency key discloses no account or verification proof.
      const response = await this.transport(RESEND_EMAILS_ENDPOINT, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.options.apiKey}`,
          "Content-Type": "application/json",
          "Idempotency-Key": randomUUID(),
        },
        body: JSON.stringify({
          from: this.options.from,
          to: [message.email],
          subject: email.subject,
          text: email.text,
          html: email.html,
        }),
        signal: controller.signal,
      });

      // API acceptance is not proof of inbox delivery. Bounce/complaint handling
      // remains an explicit production activation gate.
      if (!response.ok) throw new Error("Email delivery could not be confirmed.");
      const body: unknown = await response.json();
      if (!body || typeof body !== "object" || !("id" in body)
        || typeof body.id !== "string" || body.id.length < 1) {
        throw new Error("Email delivery could not be confirmed.");
      }
    } catch {
      // Never propagate provider responses, recipient addresses, codes or keys.
      throw new Error("Email delivery could not be confirmed.");
    } finally {
      clearTimeout(timeout);
    }
  }
}
