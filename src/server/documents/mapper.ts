import type { NormalizedOcr } from "./providers";

export type CandidateType = "blood_pressure" | "blood_glucose" | "hba1c" | "lipid_panel" | "weight" | "waist_circumference";
export type MappedCandidate = {
  recordType: CandidateType;
  value?: string;
  secondValue?: string;
  unit?: "mmhg" | "mmol_l" | "mg_dl" | "percent" | "kg" | "lb" | "cm" | "in";
  glucoseContext?: "fasting" | "before_meal" | "after_meal" | "random_other" | "not_specified";
  totalCholesterol?: string;
  hdl?: string;
  ldl?: string;
  triglycerides?: string;
  sourcePage: number;
};

const number = "([0-9]+(?:\\.[0-9]+)?)";
const concentration = "(mmol\\/L|mg\\/dL)";
const decimal = /^[0-9]+(?:\.[0-9]+)?$/;
const units = { "mmol/l": "mmol_l", "mg/dl": "mg_dl" } as const;

function contextFor(line: string): MappedCandidate["glucoseContext"] {
  if (/\bfasting\b/i.test(line)) return "fasting";
  if (/\bbefore meal\b/i.test(line)) return "before_meal";
  if (/\bafter meal\b/i.test(line)) return "after_meal";
  if (/\brandom\b/i.test(line)) return "random_other";
  return "not_specified";
}

/** Conservative, label-anchored mapping; no clinical inference or free-text persistence. */
export function mapOcrCandidates(ocr: NormalizedOcr): MappedCandidate[] {
  const candidates: MappedCandidate[] = [];
  for (const page of ocr.pages.slice(0, 15)) {
    if (!Number.isInteger(page.number) || page.number < 1 || page.number > 15) continue;
    const lipids = new Map<string, MappedCandidate>();
    for (const rawLine of page.text.slice(0, 100_000).split(/\r?\n/).slice(0, 1000)) {
      const line = rawLine.trim();
      if (line.length > 180) continue;
      let match = new RegExp(`^(?:blood pressure|bp)\\s*[:=]\\s*${number}\\s*[/]\\s*${number}\\s*mmHg$`, "i").exec(line);
      if (match) { candidates.push({ recordType: "blood_pressure", value: match[1], secondValue: match[2], unit: "mmhg", sourcePage: page.number }); continue; }
      match = new RegExp(`^blood glucose(?:\\s*\\((?:fasting|before meal|after meal|random)\\))?\\s*[:=]\\s*${number}\\s*${concentration}(?:\\s*\\((?:fasting|before meal|after meal|random)\\))?$`, "i").exec(line);
      if (match) { candidates.push({ recordType: "blood_glucose", value: match[1], unit: units[match[2].toLowerCase() as keyof typeof units], glucoseContext: contextFor(line), sourcePage: page.number }); continue; }
      match = new RegExp(`^HbA1c\\s*[:=]\\s*${number}\\s*%$`, "i").exec(line);
      if (match) { candidates.push({ recordType: "hba1c", value: match[1], unit: "percent", sourcePage: page.number }); continue; }
      match = new RegExp(`^weight\\s*[:=]\\s*${number}\\s*(kg|lb)$`, "i").exec(line);
      if (match) { candidates.push({ recordType: "weight", value: match[1], unit: match[2].toLowerCase() as "kg" | "lb", sourcePage: page.number }); continue; }
      match = new RegExp(`^waist(?: circumference)?\\s*[:=]\\s*${number}\\s*(cm|in)$`, "i").exec(line);
      if (match) { candidates.push({ recordType: "waist_circumference", value: match[1], unit: match[2].toLowerCase() as "cm" | "in", sourcePage: page.number }); continue; }
      match = new RegExp(`^(total cholesterol|HDL|LDL|triglycerides)\\s*[:=]\\s*${number}\\s*${concentration}$`, "i").exec(line);
      if (match) {
        const unit = units[match[3].toLowerCase() as keyof typeof units];
        const key = unit;
        const candidate = lipids.get(key) ?? { recordType: "lipid_panel", unit, sourcePage: page.number };
        const field = ({ "total cholesterol": "totalCholesterol", hdl: "hdl", ldl: "ldl", triglycerides: "triglycerides" } as const)[match[1].toLowerCase() as "total cholesterol" | "hdl" | "ldl" | "triglycerides"];
        candidate[field] = match[2];
        lipids.set(key, candidate);
      }
    }
    candidates.push(...lipids.values());
  }
  return candidates.filter((candidate) => Object.values(candidate).every((value) => typeof value !== "string" || !decimal.test(value) || Number.isFinite(Number(value))));
}
