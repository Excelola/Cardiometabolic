import { defineConfig } from "vitest/config";

import base from "./vitest.config";

if (!process.env.HILERA_TEST_DATABASE_ADMIN_URL) {
  throw new Error("PostgreSQL validation requires a disposable loopback PostgreSQL installation and HILERA_TEST_DATABASE_ADMIN_URL.");
}

export default defineConfig({
  ...base,
  test: { ...base.test, include: ["src/server/**/*.integration.test.ts"] },
});
