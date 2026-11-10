"use client";

import { useState } from "react";

import { healthRecordLabels, type HealthRecordType } from "@/domain/health-records";
import { MeasurementEntryForm } from "./measurement-entry-form";

const categories = [
  { title: "Health readings", description: "Readings taken during a health check.", types: ["blood_pressure", "blood_glucose", "hba1c", "lipid_panel"] },
  { title: "Body measurements", description: "Measurements that help you track changes in your body.", types: ["weight", "waist_circumference"] },
  { title: "Daily habits", description: "Everyday routines you want to keep track of.", types: ["physical_activity_duration", "sleep_duration"] },
] as const satisfies readonly { title: string; description: string; types: readonly HealthRecordType[] }[];

export function HealthEntryChooser({ csrf }: Readonly<{ csrf: string }>) {
  const [selected, setSelected] = useState<HealthRecordType | "">("");
  return (
    <section aria-labelledby="entry-categories-heading" className="app-section">
      <h2 id="entry-categories-heading">Choose a category</h2>
      <div className="entry-categories">
        {categories.map((category, index) => {
          const types: readonly HealthRecordType[] = category.types;
          const active = selected !== "" && types.includes(selected);
          return (
            <details className="entry-category" key={category.title} name="health-information-category">
              <summary><strong>{category.title}</strong><span>{category.description}</span></summary>
              <div className="entry-category__body">
                <div className="field">
                  <label htmlFor={`entry-type-${index}`}>Entry type</label>
                  <select id={`entry-type-${index}`} value={active ? selected : ""} onChange={(event) => {
                    const next = types.find((type) => type === event.currentTarget.value);
                    setSelected(next ?? "");
                  }}>
                    <option value="">Choose an entry type</option>
                    {types.map((type) => <option value={type} key={type}>{healthRecordLabels[type]}</option>)}
                  </select>
                </div>
                {active && <MeasurementEntryForm key={selected} type={selected} csrf={csrf} />}
              </div>
            </details>
          );
        })}
      </div>
    </section>
  );
}
