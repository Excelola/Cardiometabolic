"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAuthConfig } from "@/server/auth/config";
import { isTrustedAuthOrigin, verifySessionCsrf } from "@/server/auth/mutation-security";
import { getCurrentSession } from "@/server/auth/request-session";
import { getAuthDb } from "@/server/db/auth-db";
import { parseProfile } from "@/server/profile/input";
import { saveProfile } from "@/server/profile/repository";

export type ProfileState = { error: string } | null;
export async function saveProfileAction(_previous: ProfileState, form: FormData): Promise<ProfileState> {
  try {
    const config = getAuthConfig();
    if (!isTrustedAuthOrigin(await headers(), config)) return { error: "We couldn’t verify this request. Reload and try again." };
    const session = await getCurrentSession();
    if (!session || !verifySessionCsrf(session.sessionId, form.get("csrf"), config.csrfSecret)) return { error: "We couldn’t verify this request. Reload and try again." };
    const intent = form.get("intent");
    if (intent !== "continue" && intent !== "later") return { error: "Choose how to save your profile." };
    const profile = parseProfile(form, intent === "continue");
    if (!profile) return { error: "Check the name, date and country. Continue requires all three fields." };
    await saveProfile(getAuthDb(), session.userId, profile);
  } catch { return { error: "We couldn’t save your profile. Please try again." }; }
  revalidatePath("/app/dashboard");
  redirect("/app/dashboard");
}
