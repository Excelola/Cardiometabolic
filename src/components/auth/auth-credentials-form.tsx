import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { NonSubmittingForm } from "@/components/ui/non-submitting-form";

type AuthCredentialsFormProps = Readonly<{
  mode: "sign-up" | "sign-in";
}>;

export function AuthCredentialsForm({ mode }: AuthCredentialsFormProps) {
  const isSignUp = mode === "sign-up";

  return (
    <NonSubmittingForm className="stack">
      <FormField
        autoComplete="email"
        id={`${mode}-email`}
        inputMode="email"
        label="Email address"
        placeholder="name@example.com"
        required
        type="email"
      />
      <FormField
        autoComplete={isSignUp ? "new-password" : "current-password"}
        id={`${mode}-password`}
        label="Password"
        required
        type="password"
      />
      <Button type="submit">{isSignUp ? "Create account" : "Sign in"}</Button>
    </NonSubmittingForm>
  );
}
