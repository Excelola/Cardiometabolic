export type MvpAuthenticationConfig = Readonly<{
  identifier: "email";
  credential: "password";
  implementation: "frontend-shell";
  recoveryAvailable: false;
}>;

/**
 * The approved MVP experience is email and password. The frontend remains a
 * non-persisting shell until HILERA backend and security specifications are
 * separately approved and implemented.
 */
export const mvpAuthenticationConfig: MvpAuthenticationConfig = {
  identifier: "email",
  credential: "password",
  implementation: "frontend-shell",
  recoveryAvailable: false,
};
