import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/server/db/schema.ts",
  out: "./drizzle",
  ...(process.env.HILERA_MIGRATION_DATABASE_URL ? { dbCredentials: { url: process.env.HILERA_MIGRATION_DATABASE_URL } } : {}),
});
