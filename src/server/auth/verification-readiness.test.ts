import { describe, expect, it } from "vitest";
import { verificationReadiness } from "./verification-readiness";

describe("verification readiness", () => {
  it("prioritizes missing challenge configuration over recipient authorization", () => {
    expect(verificationReadiness(false, "not_authorized")).toBe("not_configured");
    expect(verificationReadiness(false, "available")).toBe("not_configured");
    expect(verificationReadiness(true, "not_authorized")).toBe("not_authorized");
    expect(verificationReadiness(true, "available")).toBe("available");
    expect(verificationReadiness(true, "not_configured")).toBe("not_configured");
  });
});
