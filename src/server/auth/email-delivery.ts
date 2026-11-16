import "server-only";

import { EMAIL_CODE_LIFETIME_MS, type EmailChallengePurpose } from "./email-challenge-code";
import { ResendEmailDelivery } from "./resend-delivery";

export interface EmailDelivery {
  send(message: Readonly<{ email: string; purpose: EmailChallengePurpose; code: string }>): Promise<void>;
}

/** Synthetic sink for injected tests only; never selected by production configuration. */
export class SyntheticEmailDelivery implements EmailDelivery {
  private readonly messages: Array<Readonly<{ email: string; purpose: EmailChallengePurpose; code: string; expires: number }>> = [];

  async send(message: Readonly<{ email: string; purpose: EmailChallengePurpose; code: string }>): Promise<void> {
    if (process.env.NODE_ENV === "production" || process.env.HILERA_SYNTHETIC_EMAIL !== "enabled") throw new Error("Synthetic delivery unavailable.");
    if (!message.email.endsWith("@example.test")) throw new Error("Synthetic delivery requires a synthetic mailbox.");
    this.removeExpired();
    if (this.messages.length >= 20) throw new Error("Synthetic delivery is full.");
    this.messages.push({ ...message, expires: Date.now() + EMAIL_CODE_LIFETIME_MS });
    setTimeout(() => this.removeExpired(), EMAIL_CODE_LIFETIME_MS).unref();
  }

  take(): Readonly<{ email: string; purpose: EmailChallengePurpose; code: string }> | undefined {
    this.removeExpired();
    const message = this.messages.shift();
    return message && { email: message.email, purpose: message.purpose, code: message.code };
  }

  private removeExpired(): void {
    for (let index = this.messages.length - 1; index >= 0; index--) {
      if (this.messages[index].expires <= Date.now()) this.messages.splice(index, 1);
    }
  }
}

const syntheticDelivery = new SyntheticEmailDelivery();

// No production sender is approved. A future sender must be explicitly reviewed and configured.
export function configuredEmailDelivery(): EmailDelivery | null {
  if (process.env.NODE_ENV === "production") return null;
  if (process.env.HILERA_EMAIL_PROVIDER === "resend" && process.env.HILERA_RESEND_TEST_DELIVERY === "enabled") {
    const recipients = (process.env.HILERA_RESEND_TEST_RECIPIENTS ?? "").split(",").map((value) => value.trim()).filter(Boolean);
    if (!recipients.length || recipients.some((value) => !/^[^\s@,<>]+@[^\s@,<>]+\.[^\s@,<>]+$/.test(value))) return null;
    try {
      const sender = new ResendEmailDelivery({ apiKey: process.env.RESEND_API_KEY ?? "", from: process.env.HILERA_RESEND_FROM ?? "" });
      return { async send(message) {
        if (!recipients.includes(message.email)) throw new Error("Email delivery could not be confirmed.");
        await sender.send(message);
      } };
    } catch { return null; }
  }
  return process.env.HILERA_SYNTHETIC_EMAIL === "enabled" && !process.env.HILERA_EMAIL_PROVIDER ? syntheticDelivery : null;
}
