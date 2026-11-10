import "server-only";

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as schema from "./schema";

export function createAuthDb(pool: Pool) {
  return drizzle(pool, { schema, logger: false });
}

export type AuthDb = ReturnType<typeof createAuthDb>;
export type AuthTransaction = Parameters<Parameters<AuthDb["transaction"]>[0]>[0];

let db: AuthDb | undefined;

export function getAuthDb(): AuthDb {
  if (db) return db;
  const connectionString = process.env.DATABASE_URL;
  const url = connectionString ? URL.parse(connectionString) : null;
  if (!connectionString || !url || !["postgres:", "postgresql:"].includes(url.protocol)
    || !url.hostname || !url.username || url.pathname.length < 2) {
    throw new Error("Authentication database is not configured.");
  }
  const sslModes = url.searchParams.getAll("sslmode");
  if (process.env.NODE_ENV === "production" && (sslModes.length !== 1 || sslModes[0] !== "verify-full")) {
    throw new Error("The production authentication database requires verified TLS.");
  }

  const pool = new Pool({ connectionString, max: 5, connectionTimeoutMillis: 3_000, idleTimeoutMillis: 10_000, statement_timeout: 5_000 });
  // Never pass driver errors (which may include connection details) to logs.
  pool.on("error", () => {});
  db = createAuthDb(pool);
  return db;
}
