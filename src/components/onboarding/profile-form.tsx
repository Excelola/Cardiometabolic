"use client";
import { useActionState } from "react";
import { saveProfileAction } from "@/app/profile-actions";
import type { ProfileInput } from "@/server/profile/input";

export function ProfileForm({ csrf, profile }: { csrf: string; profile: ProfileInput | null }) {
  const [state, action, pending] = useActionState(saveProfileAction, null);
  return <form action={action} className="onboarding-form">
    <input type="hidden" name="csrf" value={csrf} />
    {state?.error && <p role="alert">{state.error}</p>}
    <div className="field"><label htmlFor="preferred-name">Preferred name *</label><input id="preferred-name" name="preferredName" autoComplete="nickname" defaultValue={profile?.preferredName ?? ""} maxLength={100} required /></div>
    <div className="field"><label htmlFor="date-of-birth">Date of birth *</label><input id="date-of-birth" name="dateOfBirth" type="date" autoComplete="bday" defaultValue={profile?.dateOfBirth ?? ""} required /></div>
    <div className="field"><label htmlFor="market-context">Country or market *</label><select id="market-context" name="market" defaultValue={profile?.market ?? ""} required><option value="">Choose country or market</option><option value="NG">Nigeria</option></select></div>
    <div className="page-actions"><button className="button button--primary" type="submit" name="intent" value="continue" disabled={pending}>Continue</button><button className="button button--secondary" type="submit" name="intent" value="later" formNoValidate disabled={pending}>Save for later</button></div>
  </form>;
}
