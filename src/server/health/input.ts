import "server-only";

import { concentrationUnits, glucoseContexts, lipidComponents, waistUnits, weightUnits, type HealthEntry } from "@/domain/health-records";
import { readAuthForm } from "@/server/auth/input";

const decimal = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/;
const date = /^\d{4}-\d{2}-\d{2}$/;
const time = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?$/;

export function isHealthRecordId(value: unknown): value is string {
  return typeof value === "string" && /^[\da-f]{8}-(?:[\da-f]{4}-){3}[\da-f]{12}$/i.test(value);
}

function numeric(value: string): string | null {
  const text = value.trim();
  return decimal.test(text) && Number.isFinite(Number(text)) ? text : null;
}

function occurrence(value: string): string | null {
  if (!time.test(value) || value.startsWith("0000")) return null;
  const [minute, remainder = ""] = value.split(/(?<=T\d{2}:\d{2}):/);
  const [seconds = "00", fractional = ""] = (remainder || "00").split(".");
  const iso = `${minute}:${seconds}.${fractional.padEnd(3, "0")}Z`;
  const instant = new Date(iso);
  return Number.isFinite(instant.getTime()) && instant.toISOString() === iso ? iso : null;
}

function oneOf<T extends string>(value: string, choices: readonly T[]): value is T {
  return choices.some((choice) => choice === value);
}

function fieldsFor(type: unknown): readonly string[] | null {
  switch (type) {
    case "blood_pressure": return ["occurredAt", "systolic", "diastolic"];
    case "blood_glucose": return ["occurredAt", "value", "unit", "context"];
    case "hba1c": return ["occurredAt", "value"];
    case "lipid_panel": return ["occurredAt", "unit", ...lipidComponents];
    case "weight":
    case "waist_circumference": return ["occurredAt", "value", "unit"];
    case "physical_activity_duration":
    case "sleep_duration": return ["occurredOn", "durationMinutes"];
    default: return null;
  }
}

export function parseHealthForm(form: FormData, correction: boolean): HealthEntry | null {
  const type = form.get("type");
  const fields = fieldsFor(type);
  if (!fields) return null;
  if (type === "lipid_panel") {
    for (const component of lipidComponents) {
      if (!form.has(component)) form.append(component, "");
    }
  }
  const values = readAuthForm(form, ["csrf", "type", ...(correction ? ["recordId"] : []), ...fields]);
  if (!values) return null;

  if (type === "physical_activity_duration" || type === "sleep_duration") {
    const occurredOn = values.occurredOn;
    const durationMinutes = Number(values.durationMinutes);
    return date.test(occurredOn) && occurrence(`${occurredOn}T00:00`) &&
      /^\d+$/.test(values.durationMinutes) && Number.isSafeInteger(durationMinutes)
      ? { type, occurredOn, durationMinutes } : null;
  }

  const occurredAt = occurrence(values.occurredAt);
  if (!occurredAt) return null;
  switch (type) {
    case "blood_pressure": {
      const systolic = numeric(values.systolic);
      const diastolic = numeric(values.diastolic);
      return systolic !== null && diastolic !== null ? { type, occurredAt, systolic, diastolic } : null;
    }
    case "lipid_panel": {
      if (!oneOf(values.unit, concentrationUnits)) return null;
      const [totalCholesterol, hdl, ldl, triglycerides] = lipidComponents.map((field) => numeric(values[field]));
      const parts = [totalCholesterol, hdl, ldl, triglycerides];
      if (parts.every((part) => part === null) || parts.some((part, index) => part === null && values[lipidComponents[index]].trim() !== "")) return null;
      return { type, occurredAt, unit: values.unit, totalCholesterol, hdl, ldl, triglycerides };
    }
    case "blood_glucose": {
      const value = numeric(values.value);
      return value !== null && oneOf(values.unit, concentrationUnits) && oneOf(values.context, glucoseContexts)
        ? { type, occurredAt, value, unit: values.unit, context: values.context } : null;
    }
    case "hba1c": {
      const value = numeric(values.value);
      return value !== null ? { type, occurredAt, value } : null;
    }
    case "weight": {
      const value = numeric(values.value);
      return value !== null && oneOf(values.unit, weightUnits) ? { type, occurredAt, value, unit: values.unit } : null;
    }
    case "waist_circumference": {
      const value = numeric(values.value);
      return value !== null && oneOf(values.unit, waistUnits) ? { type, occurredAt, value, unit: values.unit } : null;
    }
    default: return null;
  }
}
