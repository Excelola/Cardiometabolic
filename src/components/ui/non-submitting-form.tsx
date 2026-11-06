"use client";

import type { FormHTMLAttributes, ReactNode } from "react";

type NonSubmittingFormProps = Readonly<
  Omit<FormHTMLAttributes<HTMLFormElement>, "action" | "method" | "onSubmit"> & {
    children: ReactNode;
  }
>;

export function NonSubmittingForm({ children, ...props }: NonSubmittingFormProps) {
  return (
    <form {...props} onSubmit={(event) => event.preventDefault()}>
      {children}
    </form>
  );
}
