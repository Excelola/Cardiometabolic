import "server-only";

import type { AuthTransaction } from "../db/auth-db";
import { authSecurityEvents } from "../db/schema";

export type AuthEvent =
  | { type: "sign_in_failed" }
  | { type: "account_created" | "sign_in_succeeded" | "sign_out" | "session_revoked"; userId: string };

export async function recordAuthSecurityEvent(writer: Pick<AuthTransaction, "insert">, event: AuthEvent): Promise<void> {
  await writer.insert(authSecurityEvents).values({
    eventType: event.type,
    userId: event.type === "sign_in_failed" ? null : event.userId,
  });
}
