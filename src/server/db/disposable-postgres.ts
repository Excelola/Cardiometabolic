import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";
import { createAuthDb, type AuthDb } from "./auth-db";

export const adminUrl = process.env.HILERA_TEST_DATABASE_ADMIN_URL;

function loopbackAdmin(): URL {
  const url = adminUrl ? URL.parse(adminUrl) : null;
  if (!url || !["postgres:", "postgresql:"].includes(url.protocol) || !["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)
    || url.pathname !== "/postgres" || url.search || url.hash || !url.username || !url.password) {
    throw new Error("Provide an explicitly local disposable PostgreSQL administrator URL ending in /postgres.");
  }
  return url;
}

export async function disposable<T>(work: (db: AuthDb, name: string, url: URL) => Promise<T>): Promise<T> {
  const url = loopbackAdmin();
  const admin = new Pool({ connectionString: url.href, connectionTimeoutMillis: 3000 });
  const name = `hilera_auth_test_${randomUUID().replaceAll("-", "")}`;
  const identifier = `"${name}"`; // Name is generated here, never from an external argument.
  try {
    await admin.query(`CREATE DATABASE ${identifier}`);
    const target = new URL(url);
    target.pathname = `/${name}`;
    const pool = new Pool({ connectionString: target.href, connectionTimeoutMillis: 3000 });
    try {
      return await work(createAuthDb(pool), name, url);
    } finally {
      await pool.end();
      await admin.query(`DROP DATABASE ${identifier}`);
    }
  } finally {
    await admin.end();
  }
}

export async function applyMigrations(db: AuthDb, migrationsFolder = "./drizzle") {
  await migrate(db, { migrationsFolder });
}

export function runPgTool(program: "pg_dump" | "pg_restore", args: string[], name: string, url: URL) {
  try {
    execFileSync(program, ["--dbname", name, ...args], { env: {
      NODE_ENV: "test", SystemRoot: process.env.SystemRoot, PATH: process.env.PATH, PGHOST: url.hostname.replace(/^\[|\]$/g, ""),
      PGPORT: url.port || "5432", PGUSER: decodeURIComponent(url.username), PGPASSWORD: decodeURIComponent(url.password),
    }, timeout: 25_000, stdio: "pipe" });
  } catch {
    throw new Error(`${program} failed on the disposable synthetic database. Verify the local PostgreSQL CLI is installed and compatible.`);
  }
}
