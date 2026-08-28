import { describe, expect, it } from "vitest";

import { PRODUCT_STATES, isProductState } from "./product-state";

describe("product state model", () => {
  it("contains the eight approved product states in order", () => {
    expect(PRODUCT_STATES).toEqual([
      "Account Created",
      "Consent Required",
      "Setup Not Started",
      "Setup In Progress",
      "Baseline Data Needed",
      "Summary Pending Inputs",
      "Summary Available",
      "Active Monitoring",
    ]);
  });

  it("rejects values outside the approved state model", () => {
    expect(isProductState("Setup In Progress")).toBe(true);
    expect(isProductState("Clinically Assessed")).toBe(false);
  });
});
