"use client";

import { useActionState } from "react";

import { signOut } from "@/app/auth-actions";

export function SignOutForm({ csrf }: Readonly<{ csrf: string }>) {
  const [state, action, pending] = useActionState(signOut, null);

  return (
    <form action={action} className="sign-out-form">
      <input name="csrf" type="hidden" value={csrf} />
      <button className="account-placeholder" disabled={pending} type="submit">Sign out</button>
      {state?.error ? <p className="sign-out-form__error" role="alert">{state.error}</p> : null}
    </form>
  );
}
