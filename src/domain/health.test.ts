import { describe, expect, it } from "vitest";

import {
  DATA_PROVENANCE,
  MOCK_MEASUREMENT_DEFINITION,
  MOCK_MEASUREMENT_HISTORY,
} from "./health";

describe("health UI foundation", () => {
  it("exposes only the approved provenance labels", () => {
    expect(DATA_PROVENANCE).toEqual([
      "User Entered",
      "Imported",
      "Verified",
      "System Derived",
    ]);
  });

  it("keeps the mock measurement clinically generic", () => {
    expect(MOCK_MEASUREMENT_DEFINITION.displayName).toBe(
      "Measurement placeholder",
    );
    expect(MOCK_MEASUREMENT_DEFINITION.fields[0]?.unitLabel).toBeUndefined();
  });

  it("uses synthetic history rows to present every approved provenance label", () => {
    expect(MOCK_MEASUREMENT_HISTORY.map((item) => item.provenance)).toEqual(
      DATA_PROVENANCE,
    );
    expect(MOCK_MEASUREMENT_HISTORY.every((item) => item.value === "—")).toBe(true);
  });
});
