import { describe, expect, it } from "vitest";

import { DEFAULT_PRODUCT_NAME } from "./product";

describe("public product configuration", () => {
  it("uses the approved HILERA fallback name", () => {
    expect(DEFAULT_PRODUCT_NAME).toBe("HILERA");
  });
});
