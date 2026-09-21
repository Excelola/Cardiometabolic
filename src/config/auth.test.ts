import { describe, expect, it } from "vitest";

import { mvpAuthenticationConfig } from "./auth";

describe("MVP authentication configuration", () => {
  it("uses the approved email and password frontend shell", () => {
    expect(mvpAuthenticationConfig).toEqual({
      identifier: "email",
      credential: "password",
      implementation: "frontend-shell",
      recoveryAvailable: false,
    });
  });

  it("does not add unapproved authentication policy values", () => {
    expect(Object.keys(mvpAuthenticationConfig).sort()).toEqual(
      ["credential", "identifier", "implementation", "recoveryAvailable"].sort(),
    );
  });
});
