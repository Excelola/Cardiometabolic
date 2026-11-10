import { describe, expect, it } from "vitest";

import { mvpAuthenticationConfig } from "./auth";

describe("MVP authentication configuration", () => {
  it("uses first-party email and password authentication", () => {
    expect(mvpAuthenticationConfig).toEqual({
      identifier: "email",
      credential: "password",
      implementation: "first-party",
      recoveryAvailable: false,
    });
  });

  it("does not add unapproved authentication policy values", () => {
    expect(Object.keys(mvpAuthenticationConfig).sort()).toEqual(
      ["credential", "identifier", "implementation", "recoveryAvailable"].sort(),
    );
  });
});
