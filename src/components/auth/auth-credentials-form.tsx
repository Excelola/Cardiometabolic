"use client";

import { useActionState } from "react";

import { signIn, signUp } from "@/app/auth-actions";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Notice } from "@/components/ui/notice";

type AuthCredentialsFormProps = Readonly<{
  mode: "sign-up" | "sign-in";
}>;

export function AuthCredentialsForm({ mode }: AuthCredentialsFormProps) {
  const isSignUp = mode === "sign-up";
  const [state, action, pending] = useActionState(isSignUp ? signUp : signIn, null);

  return (
    <form action={action} className="stack">
      {state?.error ? <Notice tone="critical">{state.error}</Notice> : null}
      <FormField
        autoComplete="email"
        id={`${mode}-email`}
        inputMode="email"
        label="Email address"
        name="email"
        placeholder="name@example.com"
        required
        type="email"
      />
      <FormField
        autoComplete={isSignUp ? "new-password" : "current-password"}
        helperText={isSignUp ? "Use at least 15 characters." : undefined}
        id={`${mode}-password`}
        label="Password"
        name="password"
        required
        type="password"
      />
      <Button disabled={pending} type="submit">{isSignUp ? "Create account" : "Sign in"}</Button>
    </form>
  );
}
