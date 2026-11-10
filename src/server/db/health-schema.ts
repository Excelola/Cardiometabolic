import { sql, type SQLWrapper } from "drizzle-orm";
import { check, date, foreignKey, index, integer, numeric, pgEnum, pgTable, timestamp, unique, uuid, type AnyPgColumn } from "drizzle-orm/pg-core";

import { concentrationUnits, glucoseContexts, healthRecordTypes, waistUnits, weightUnits } from "../../domain/health-records";
import { users } from "./schema";

const instant = (name: string) => timestamp(name, { withTimezone: true, mode: "string" });
export const healthRecordType = pgEnum("health_record_type", healthRecordTypes);
export const healthProvenance = pgEnum("health_record_provenance", ["user_entered"]);
export const concentrationUnit = pgEnum("health_concentration_unit", concentrationUnits);
export const glucoseContext = pgEnum("health_glucose_context", glucoseContexts);
export const weightUnit = pgEnum("health_weight_unit", weightUnits);
export const waistUnit = pgEnum("health_waist_unit", waistUnits);

export const healthRecords = pgTable("health_records", {
  id: uuid().defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "restrict" }),
  recordType: healthRecordType("record_type").notNull(),
  provenance: healthProvenance().notNull().default("user_entered"),
  occurredAt: instant("occurred_at"),
  occurredOn: date("occurred_on"),
  enteredAt: instant("entered_at").notNull().defaultNow(),
  supersedesRecordId: uuid("supersedes_record_id").unique("health_records_one_replacement"),
  supersededAt: instant("superseded_at"),
  supersededByRecordId: uuid("superseded_by_record_id").unique("health_records_one_predecessor"),
}, (table) => [
  unique("health_records_id_type_key").on(table.id, table.recordType),
  unique("health_records_id_owner_type_key").on(table.id, table.userId, table.recordType),
  foreignKey({ name: "health_records_predecessor_fk", columns: [table.supersedesRecordId, table.userId, table.recordType], foreignColumns: [table.id, table.userId, table.recordType] }).onDelete("restrict"),
  foreignKey({ name: "health_records_replacement_fk", columns: [table.supersededByRecordId, table.userId, table.recordType], foreignColumns: [table.id, table.userId, table.recordType] }).onDelete("restrict"),
  check("health_records_occurrence_shape", sql`
    case when ${table.recordType} in ('physical_activity_duration', 'sleep_duration')
      then ${table.occurredAt} is null and ${table.occurredOn} is not null and isfinite(${table.occurredOn})
      else ${table.occurredOn} is null and ${table.occurredAt} is not null and isfinite(${table.occurredAt})
    end`),
  check("health_records_supersession_shape", sql`(${table.supersededAt} is null) = (${table.supersededByRecordId} is null)
    and ${table.supersedesRecordId} is distinct from ${table.id}
    and ${table.supersededByRecordId} is distinct from ${table.id}
    and (${table.supersedesRecordId} is null or ${table.supersedesRecordId} is distinct from ${table.supersededByRecordId})`),
  index("health_records_owner_idx").on(table.userId),
  index("health_records_current_history_idx").on(table.userId,
    sql`coalesce(${table.occurredAt}, ${table.occurredOn}::timestamp at time zone 'UTC') desc`, table.enteredAt.desc(), table.id.desc())
    .where(sql`${table.supersededAt} is null`),
]);

type RecordType = (typeof healthRecordTypes)[number];
function subtypeKey(type: RecordType) {
  return {
    healthRecordId: uuid("health_record_id").primaryKey(),
    recordType: healthRecordType("record_type").notNull().default(type),
  };
}

function subtypeConstraints(name: string, type: RecordType, table: {
  healthRecordId: AnyPgColumn;
  recordType: AnyPgColumn;
}) {
  return [
    check(`${name}_type`, sql`${table.recordType} = '${sql.raw(type)}'`),
    foreignKey({ name: `${name}_record_fk`, columns: [table.healthRecordId, table.recordType], foreignColumns: [healthRecords.id, healthRecords.recordType] }).onDelete("restrict"),
  ];
}

function finite(name: string, ...columns: SQLWrapper[]) {
  return check(name, sql.join(columns.map((column) => sql`${column} not in ('NaN', 'Infinity', '-Infinity')`), sql` and `));
}

export const bloodPressureRecords = pgTable("blood_pressure_records", {
  ...subtypeKey("blood_pressure"),
  systolic: numeric("systolic_value").notNull(),
  diastolic: numeric("diastolic_value").notNull(),
}, (t) => [...subtypeConstraints("blood_pressure", "blood_pressure", t), finite("blood_pressure_finite", t.systolic, t.diastolic)]);

export const bloodGlucoseRecords = pgTable("blood_glucose_records", {
  ...subtypeKey("blood_glucose"),
  value: numeric("glucose_value").notNull(),
  unit: concentrationUnit().notNull(),
  context: glucoseContext().notNull(),
}, (t) => [...subtypeConstraints("blood_glucose", "blood_glucose", t), finite("blood_glucose_finite", t.value)]);

export const hba1cRecords = pgTable("hba1c_records", {
  ...subtypeKey("hba1c"),
  value: numeric("hba1c_value").notNull(),
}, (t) => [...subtypeConstraints("hba1c", "hba1c", t), finite("hba1c_finite", t.value)]);

export const lipidPanelRecords = pgTable("lipid_panel_records", {
  ...subtypeKey("lipid_panel"),
  unit: concentrationUnit().notNull(),
  totalCholesterol: numeric("total_cholesterol_value"),
  hdl: numeric("hdl_value"),
  ldl: numeric("ldl_value"),
  triglycerides: numeric("triglycerides_value"),
}, (t) => [
  ...subtypeConstraints("lipid_panel", "lipid_panel", t),
  check("lipid_panel_has_component", sql`num_nonnulls(${t.totalCholesterol}, ${t.hdl}, ${t.ldl}, ${t.triglycerides}) > 0`),
  finite("lipid_panel_finite", t.totalCholesterol, t.hdl, t.ldl, t.triglycerides),
]);

export const weightRecords = pgTable("weight_records", {
  ...subtypeKey("weight"),
  value: numeric("weight_value").notNull(),
  unit: weightUnit().notNull(),
}, (t) => [...subtypeConstraints("weight", "weight", t), finite("weight_finite", t.value)]);

export const waistCircumferenceRecords = pgTable("waist_circumference_records", {
  ...subtypeKey("waist_circumference"),
  value: numeric("waist_value").notNull(),
  unit: waistUnit().notNull(),
}, (t) => [...subtypeConstraints("waist_circumference", "waist_circumference", t), finite("waist_circumference_finite", t.value)]);

export const physicalActivityRecords = pgTable("physical_activity_records", {
  ...subtypeKey("physical_activity_duration"),
  durationMinutes: integer("duration_minutes").notNull(),
}, (t) => [...subtypeConstraints("physical_activity", "physical_activity_duration", t),
  check("physical_activity_whole_duration", sql`${t.durationMinutes} >= 0`)]);

export const sleepRecords = pgTable("sleep_records", {
  ...subtypeKey("sleep_duration"),
  durationMinutes: integer("duration_minutes").notNull(),
}, (t) => [...subtypeConstraints("sleep", "sleep_duration", t),
  check("sleep_whole_duration", sql`${t.durationMinutes} >= 0`)]);
