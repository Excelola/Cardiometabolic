import "server-only";

import { and, desc, eq, isNull, sql } from "drizzle-orm";

import type { HealthEntry, HealthHistoryEntry } from "@/domain/health-records";
import type { AuthDb, AuthTransaction } from "@/server/db/auth-db";
import {
  healthRecords, bloodPressureRecords, bloodGlucoseRecords, hba1cRecords, lipidPanelRecords,
  weightRecords, waistCircumferenceRecords, physicalActivityRecords, sleepRecords,
} from "@/server/db/health-schema";
import { isHealthRecordId } from "./input";

function current(ownerId: string) {
  return and(eq(healthRecords.userId, ownerId), isNull(healthRecords.supersededAt));
}

export async function insertRecord(tx: AuthTransaction, ownerId: string, entry: HealthEntry, predecessor?: string, provenance: "user_entered" | "document_assisted" = "user_entered") {
  const [{ id }] = await tx.insert(healthRecords).values({
    userId: ownerId,
    recordType: entry.type,
    provenance,
    ...("occurredAt" in entry ? { occurredAt: entry.occurredAt } : { occurredOn: entry.occurredOn }),
    supersedesRecordId: predecessor,
  }).returning({ id: healthRecords.id });
  const healthRecordId = id;
  switch (entry.type) {
    case "blood_pressure":
      await tx.insert(bloodPressureRecords).values({ healthRecordId, systolic: entry.systolic, diastolic: entry.diastolic });
      break;
    case "blood_glucose":
      await tx.insert(bloodGlucoseRecords).values({ healthRecordId, value: entry.value, unit: entry.unit, context: entry.context });
      break;
    case "hba1c":
      await tx.insert(hba1cRecords).values({ healthRecordId, value: entry.value });
      break;
    case "lipid_panel":
      await tx.insert(lipidPanelRecords).values({
        healthRecordId, unit: entry.unit, totalCholesterol: entry.totalCholesterol,
        hdl: entry.hdl, ldl: entry.ldl, triglycerides: entry.triglycerides,
      });
      break;
    case "weight":
      await tx.insert(weightRecords).values({ healthRecordId, value: entry.value, unit: entry.unit });
      break;
    case "waist_circumference":
      await tx.insert(waistCircumferenceRecords).values({ healthRecordId, value: entry.value, unit: entry.unit });
      break;
    case "physical_activity_duration":
      await tx.insert(physicalActivityRecords).values({ healthRecordId, durationMinutes: entry.durationMinutes });
      break;
    case "sleep_duration":
      await tx.insert(sleepRecords).values({ healthRecordId, durationMinutes: entry.durationMinutes });
      break;
  }
  return id;
}

export function createHealthRecord(db: AuthDb, ownerId: string, entry: HealthEntry) {
  return db.transaction((tx) => insertRecord(tx, ownerId, entry));
}

export function correctHealthRecord(db: AuthDb, ownerId: string, id: string, entry: HealthEntry) {
  return db.transaction(async (tx) => {
    const where = and(current(ownerId), eq(healthRecords.id, id), eq(healthRecords.recordType, entry.type));
    const [old] = await tx.select({ id: healthRecords.id }).from(healthRecords).where(where).for("update");
    if (!old) return null;
    const replacement = await insertRecord(tx, ownerId, entry, old.id);
    const [updated] = await tx.update(healthRecords)
      .set({ supersededAt: sql`clock_timestamp()`, supersededByRecordId: replacement })
      .where(where).returning({ id: healthRecords.id });
    if (!updated) throw new Error("Health record correction could not be completed.");
    return replacement;
  });
}

function ownedRows(db: AuthDb, ownerId: string, id?: string) {
  return db.select({
    record: healthRecords,
    pressure: bloodPressureRecords,
    glucose: bloodGlucoseRecords,
    hba1c: hba1cRecords,
    lipids: lipidPanelRecords,
    weight: weightRecords,
    waist: waistCircumferenceRecords,
    activity: physicalActivityRecords,
    sleep: sleepRecords,
  }).from(healthRecords)
    .leftJoin(bloodPressureRecords, eq(bloodPressureRecords.healthRecordId, healthRecords.id))
    .leftJoin(bloodGlucoseRecords, eq(bloodGlucoseRecords.healthRecordId, healthRecords.id))
    .leftJoin(hba1cRecords, eq(hba1cRecords.healthRecordId, healthRecords.id))
    .leftJoin(lipidPanelRecords, eq(lipidPanelRecords.healthRecordId, healthRecords.id))
    .leftJoin(weightRecords, eq(weightRecords.healthRecordId, healthRecords.id))
    .leftJoin(waistCircumferenceRecords, eq(waistCircumferenceRecords.healthRecordId, healthRecords.id))
    .leftJoin(physicalActivityRecords, eq(physicalActivityRecords.healthRecordId, healthRecords.id))
    .leftJoin(sleepRecords, eq(sleepRecords.healthRecordId, healthRecords.id))
    .where(and(current(ownerId), id === undefined ? undefined : eq(healthRecords.id, id)));
}

function historyEntry(row: Awaited<ReturnType<typeof ownedRows>>[number]): HealthHistoryEntry {
  const { id, recordType: type, occurredOn } = row.record;
  const provenance = row.record.provenance;
  if (occurredOn) {
    const duration = type === "physical_activity_duration" ? row.activity : row.sleep;
    if (duration && (type === "physical_activity_duration" || type === "sleep_duration")) {
      return { id, provenance, entry: { type, occurredOn, durationMinutes: duration.durationMinutes } };
    }
  }
  const occurredAt = row.record.occurredAt ? new Date(row.record.occurredAt).toISOString() : null;
  if (occurredAt) {
    switch (type) {
      case "blood_pressure":
        if (row.pressure) return { id, provenance, entry: { type, occurredAt, systolic: row.pressure.systolic, diastolic: row.pressure.diastolic } };
        break;
      case "blood_glucose":
        if (row.glucose) return { id, provenance, entry: { type, occurredAt, value: row.glucose.value, unit: row.glucose.unit, context: row.glucose.context } };
        break;
      case "hba1c":
        if (row.hba1c) return { id, provenance, entry: { type, occurredAt, value: row.hba1c.value } };
        break;
      case "lipid_panel":
        if (row.lipids) {
          const { unit, totalCholesterol, hdl, ldl, triglycerides } = row.lipids;
          return { id, provenance, entry: { type, occurredAt, unit, totalCholesterol, hdl, ldl, triglycerides } };
        }
        break;
      case "weight":
        if (row.weight) return { id, provenance, entry: { type, occurredAt, value: row.weight.value, unit: row.weight.unit } };
        break;
      case "waist_circumference":
        if (row.waist) return { id, provenance, entry: { type, occurredAt, value: row.waist.value, unit: row.waist.unit } };
        break;
    }
  }
  throw new Error("Health record is incomplete.");
}

export async function listHealthHistory(db: AuthDb, ownerId: string): Promise<HealthHistoryEntry[]> {
  const rows = await ownedRows(db, ownerId).orderBy(
    desc(sql`coalesce(${healthRecords.occurredAt}, ${healthRecords.occurredOn}::timestamp at time zone 'UTC')`),
    desc(healthRecords.enteredAt), desc(healthRecords.id),
  );
  return rows.map(historyEntry);
}

export async function getCurrentHealthRecord(db: AuthDb, ownerId: string, id: string): Promise<HealthHistoryEntry | null> {
  if (!isHealthRecordId(id)) return null;
  const [row] = await ownedRows(db, ownerId, id).limit(1);
  return row ? historyEntry(row) : null;
}
