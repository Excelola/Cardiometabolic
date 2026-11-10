export type MvpAuthenticationConfig = Readonly<{
  identifier: "email";
  credential: "password";
  implementation: "first-party";
  recoveryAvailable: false;
}>;

/**
 * HILERA manages the approved email and password authentication flow.
 */
export const mvpAuthenticationConfig: MvpAuthenticationConfig = {
  identifier: "email",
  credential: "password",
  implementation: "first-party",
  recoveryAvailable: false,
};
