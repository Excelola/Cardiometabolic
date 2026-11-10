"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import type { HealthMutationState } from "@/domain/health-records";
import { getAuthConfig } from "@/server/auth/config";
import { isTrustedAuthOrigin, verifySessionCsrf } from "@/server/auth/mutation-security";
import { getCurrentSession } from "@/server/auth/request-session";
import { getAuthDb } from "@/server/db/auth-db";
import { isHealthRecordId, parseHealthForm } from "@/server/health/input";
import { correctHealthRecord, createHealthRecord } from "@/server/health/repository";

const history = "/app/measurements/history";
const invalidRequest = { error: "We couldn’t verify this request. Reload the page and try again." };
const invalidFields = { error: "Check the required fields, values, date and unit. For a lipid panel, enter at least one result." };
const recordUnavailable = { error: "This entry is unavailable for correction. Open History and choose a current entry." };
const saveUnavailable = { error: "We couldn’t save this entry. Please try again." };

async function save(form: FormData, correction: boolean): Promise<HealthMutationState> {
  try {
    const config = getAuthConfig();
    if (!isTrustedAuthOrigin(await headers(), config)) return invalidRequest;
    const principal = await getCurrentSession();
    if (!principal || !verifySessionCsrf(principal.sessionId, form.get("csrf"), config.csrfSecret)) return invalidRequest;
    const entry = parseHealthForm(form, correction);
    if (!entry) return invalidFields;
    const db = getAuthDb();
    if (correction) {
      const id = form.get("recordId");
      if (!isHealthRecordId(id) || !await correctHealthRecord(db, principal.userId, id, entry)) return recordUnavailable;
    } else {
      await createHealthRecord(db, principal.userId, entry);
    }
  } catch {
    return saveUnavailable;
  }
  revalidatePath(history);
  redirect(history);
}

export async function createHealthRecordAction(_previous: HealthMutationState, form: FormData) {
  return save(form, false);
}

export async function correctHealthRecordAction(_previous: HealthMutationState, form: FormData) {
  return save(form, true);
}
