"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { getAuthConfig } from "@/server/auth/config";
import { isTrustedAuthOrigin, verifySessionCsrf } from "@/server/auth/mutation-security";
import { getCurrentSession } from "@/server/auth/request-session";
import { getAuthDb } from "@/server/db/auth-db";
import { cancelDocumentUpload, confirmDocumentUpload } from "@/server/documents/service";
import { isHealthRecordId } from "@/server/health/input";

export type DocumentActionState = { error: string } | null;

async function principalFor(form: FormData) {
  const config = getAuthConfig();
  if (!isTrustedAuthOrigin(await headers(), config)) return null;
  const principal = await getCurrentSession();
  return principal && verifySessionCsrf(principal.sessionId, form.get("csrf"), config.csrfSecret) ? principal : null;
}

export async function confirmHealthDocumentAction(_previous: DocumentActionState, form: FormData): Promise<DocumentActionState> {
  let success = false;
  try {
    const principal = await principalFor(form);
    const uploadId = form.get("uploadId");
    if (!principal || !isHealthRecordId(uploadId)) return { error: "We couldn’t verify this request. Reload and try again." };
    const result = await confirmDocumentUpload(getAuthDb(), principal.userId, uploadId, form);
    if (result === "expired") return { error: "This review has expired. Start a new upload." };
    if (result === "unavailable") return { error: "This review is unavailable. Start a new upload." };
    if (result === "invalid") return { error: "Select at least one item and check its fields, unit, and date." };
    success = true;
  } catch { return { error: "We couldn’t save this information. Please try again." }; }
  if (success) {
    revalidatePath("/app/measurements/history");
    redirect("/app/measurements/history");
  }
  return null;
}

export async function cancelHealthDocumentAction(form: FormData): Promise<void> {
  try {
    const principal = await principalFor(form);
    const uploadId = form.get("uploadId");
    if (principal && isHealthRecordId(uploadId)) await cancelDocumentUpload(getAuthDb(), principal.userId, uploadId);
  } catch { /* Public result is the same for absent and foreign uploads. */ }
  redirect("/app/measurements/new");
}
