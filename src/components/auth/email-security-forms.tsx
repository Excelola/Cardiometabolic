"use client";

import { useActionState } from "react";

import { completeRecovery, completeVerification, requestRecovery, requestVerification } from "@/app/email-security-actions";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Notice } from "@/components/ui/notice";

export function VerificationForms({ csrf }: Readonly<{ csrf: string }>) {
  const [requestState, request, requesting] = useActionState(requestVerification, null);
  const [completeState, complete, completing] = useActionState(completeVerification, null);
  return <div className="stack">
    <form action={request} className="stack">
      <input type="hidden" name="csrf" value={csrf} />
      <p>Request a code for your registered email address.</p>
      {requestState && <Notice tone={requestState.error ? "critical" : "info"}>{requestState.message}</Notice>}
      <Button type="submit" disabled={requesting}>Request verification code</Button>
    </form>
    <form action={complete} className="stack">
      <input type="hidden" name="csrf" value={csrf} />
      {completeState && <Notice tone={completeState.error ? "critical" : "info"}>{completeState.message}</Notice>}
      <FormField id="verification-code" name="code" label="Verification code" autoComplete="one-time-code" helperText="Enter the 22-character code exactly as shown. Codes are case-sensitive." required />
      <Button type="submit" disabled={completing}>Verify email</Button>
    </form>
  </div>;
}

export function RecoveryForms() {
  const [requestState, request, requesting] = useActionState(requestRecovery, null);
  const [completeState, complete, completing] = useActionState(completeRecovery, null);
  return <div className="stack">
    <form action={request} className="stack">
      <p>Enter your registered email address to request recovery instructions.</p>
      {requestState && <Notice tone={requestState.error ? "critical" : "info"}>{requestState.message}</Notice>}
      <FormField id="recovery-request-email" name="email" label="Email address" type="email" autoComplete="email" required />
      <Button type="submit" disabled={requesting}>Request recovery code</Button>
    </form>
    <form action={complete} className="stack">
      <h2>Enter your recovery code</h2>
      {completeState && <Notice tone={completeState.error ? "critical" : "info"}>{completeState.message}</Notice>}
      <FormField id="recovery-email" name="email" label="Email address" type="email" autoComplete="email" required />
      <FormField id="recovery-code" name="code" label="Recovery code" autoComplete="one-time-code" helperText="Enter the 22-character code exactly as shown. Codes are case-sensitive." required />
      <FormField id="recovery-password" name="password" label="New password" type="password" autoComplete="new-password" helperText="Use at least 15 characters." required />
      <FormField id="recovery-confirm-password" name="confirmPassword" label="Confirm new password" type="password" autoComplete="new-password" required />
      <Button type="submit" disabled={completing}>Reset password</Button>
    </form>
  </div>;
}
