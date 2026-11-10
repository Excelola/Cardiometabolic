import { describe, expect, it } from "vitest";
import { parseHealthForm } from "./input";

function form(values: Record<string, string>) {
  const data = new FormData();
  for (const [name, value] of Object.entries({ csrf: "fixture", ...values })) data.append(name, value);
  return data;
}

const occurredAt = "2026-10-15T03:04";
const occurredOn = "2026-10-15";

describe("manual health entry validation", () => {
  it.each([
    { type: "blood_pressure", occurredAt, systolic: "-9999.25", diastolic: "9999" },
    { type: "blood_glucose", occurredAt, value: "123.45", unit: "mg_dl", context: "not_specified" },
    { type: "hba1c", occurredAt, value: "12345.67" },
    { type: "lipid_panel", occurredAt, unit: "mmol_l", hdl: "1.23" },
    { type: "weight", occurredAt, value: "123.45", unit: "lb" },
    { type: "waist_circumference", occurredAt, value: "123.45", unit: "in" },
    { type: "physical_activity_duration", occurredOn, durationMinutes: "0" },
    { type: "sleep_duration", occurredOn, durationMinutes: "321" },
  ] as Record<string, string>[])("accepts structural fields for $type", (values) => {
    expect(parseHealthForm(form(values), false)).toMatchObject({ type: values.type });
  });

  it.each([
    { type: "weight", occurredAt, value: "1.3", unit: "mg_dl" },
    { type: "blood_glucose", occurredAt, value: "1.3", unit: "mmol_l", context: "unknown" },
    { type: "lipid_panel", occurredAt, unit: "mg_dl" },
    { type: "lipid_panel", occurredAt, unit: "mg_dl", hdl: "1", ldl: "NaN" },
    { type: "sleep_duration", occurredOn, durationMinutes: "10.2" },
    { type: "physical_activity_duration", occurredOn: "2026-02-29", durationMinutes: "3" },
    { type: "blood_pressure", occurredAt, systolic: "12" },
    { type: "hba1c", occurredAt: "2026-04-31T23:00", value: "15" },
    { type: "weight", occurredAt, value: "Infinity", unit: "kg" },
    { type: "weight", occurredAt, value: "1", unit: "kg", userId: "another-user" },
  ] as Record<string, string>[])("rejects structurally invalid $type submissions", (values) => {
    expect(parseHealthForm(form(values), false)).toBeNull();
  });

  it("preserves exact decimal text and fractional seconds and rejects duplicate fields", () => {
    const data = form({ type: "weight", occurredAt: "2026-10-15T03:04:05.12", value: "2.000000000000001", unit: "kg" });
    expect(parseHealthForm(data, false)).toMatchObject({ value: "2.000000000000001", occurredAt: "2026-10-15T03:04:05.120Z" });
    data.append("unit", "lb");
    expect(parseHealthForm(data, false)).toBeNull();
  });
});
