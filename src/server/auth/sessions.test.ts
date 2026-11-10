import { describe, expect, it, vi } from "vitest";

import type { AuthDb, AuthTransaction } from "../db/auth-db";
import { ABSOLUTE_SESSION_MS, SESSION_ACTIVITY_WRITE_INTERVAL_MS, IDLE_SESSION_MS, nextIdleExpiry, renewSessionActivity } from "./sessions";

const createdAt = new Date("2026-11-10T00:00:00Z");
const atOffset = (milliseconds: number) => new Date(createdAt.getTime() + milliseconds);
const session = {
  createdAt,
  idleExpiresAt: atOffset(IDLE_SESSION_MS),
  absoluteExpiresAt: atOffset(ABSOLUTE_SESSION_MS),
  revokedAt: null,
};

describe("session idle renewal policy", () => {
  it("renews from the qualifying activity time at the exact write interval", () => {
    expect(nextIdleExpiry(session, atOffset(SESSION_ACTIVITY_WRITE_INTERVAL_MS - 1))).toBeNull();
    expect(nextIdleExpiry(session, atOffset(SESSION_ACTIVITY_WRITE_INTERVAL_MS))).toEqual(
      atOffset(IDLE_SESSION_MS + SESSION_ACTIVITY_WRITE_INTERVAL_MS),
    );
    expect(nextIdleExpiry(session, atOffset(IDLE_SESSION_MS - 1))).toEqual(atOffset(2 * IDLE_SESSION_MS - 1));
  });

  it("rejects activity before issuance, at idle expiry and after revocation", () => {
    expect(nextIdleExpiry(session, atOffset(-1))).toBeNull();
    expect(nextIdleExpiry(session, session.idleExpiresAt)).toBeNull();
    const revoked = { ...session, revokedAt: atOffset(SESSION_ACTIVITY_WRITE_INTERVAL_MS) };
    expect(nextIdleExpiry(revoked, atOffset(2 * SESSION_ACTIVITY_WRITE_INTERVAL_MS))).toBeNull();
  });

  it("caps the renewed deadline and cannot extend a session already at the absolute bound", () => {
    const nearAbsolute = { ...session, idleExpiresAt: atOffset(ABSOLUTE_SESSION_MS - 15 * 60_000) };
    const activity = atOffset(ABSOLUTE_SESSION_MS - 30 * 60_000);
    expect(nextIdleExpiry(nearAbsolute, activity)).toEqual(session.absoluteExpiresAt);

    const capped = { ...session, idleExpiresAt: session.absoluteExpiresAt };
    expect(nextIdleExpiry(capped, atOffset(ABSOLUTE_SESSION_MS - 1))).toBeNull();
    expect(nextIdleExpiry(capped, session.absoluteExpiresAt)).toBeNull();
  });

  it("samples the database clock after acquiring the row lock and refuses a queued expired renewal", async () => {
    const rowLock = Promise.withResolvers<(typeof session)[]>();
    const lockRow = vi.fn().mockReturnValue(rowLock.promise);
    const readClock = vi.fn().mockResolvedValue({ rows: [{ epoch_ms: session.idleExpiresAt.getTime() }] });
    const update = vi.fn();
    const transaction = {
      select: () => ({ from: () => ({ where: () => ({ for: lockRow }) }) }),
      execute: readClock,
      update,
    } as unknown as AuthTransaction;
    const db = { transaction: (work: (tx: AuthTransaction) => Promise<boolean>) => work(transaction) } as unknown as AuthDb;

    const pending = renewSessionActivity(db, { sessionId: "synthetic-session", userId: "synthetic-user" });
    expect(lockRow).toHaveBeenCalledWith("update");
    expect(readClock).not.toHaveBeenCalled();
    rowLock.resolve([session]);

    await expect(pending).resolves.toBe(false);
    expect(readClock).toHaveBeenCalledTimes(1);
    expect(update).not.toHaveBeenCalled();
  });
});
