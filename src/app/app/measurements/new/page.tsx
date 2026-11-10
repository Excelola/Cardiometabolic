import type { Metadata } from "next";

import { MeasurementEntryForm } from "@/components/health/measurement-entry-form";
import { Notice } from "@/components/ui/notice";
import { PageTitle } from "@/components/ui/page-title";
import { MOCK_MEASUREMENT_DEFINITION } from "@/domain/health";

export const metadata: Metadata = { title: "Add Health Information" };

const ENTRY_CATEGORIES = [
  { id: "health-readings", title: "Health readings", description: "Readings taken during a health check." },
  { id: "body-measurements", title: "Body measurements", description: "Measurements that help you track changes in your body." },
  { id: "daily-habits", title: "Daily habits", description: "Everyday routines you want to keep track of." },
] as const;

export default function HealthInformationEntryPage() {
  return (
    <>
      <PageTitle title="Add Health Information">
        <p className="lede">Choose the kind of health information you want to add.</p>
      </PageTitle>
      <Notice title="HILERA test preview">
        <p>Use fictional information only. Do not enter real health information or passwords. Nothing is saved in this preview.</p>
      </Notice>
      <section aria-labelledby="entry-categories-heading" className="app-section">
        <h2 id="entry-categories-heading">Choose a category</h2>
        <div className="entry-categories">
          {ENTRY_CATEGORIES.map((category) => (
            <details className="entry-category" key={category.id} name="health-information-category">
              <summary>
                <strong>{category.title}</strong>
                <span>{category.description}</span>
              </summary>
              <div className="entry-category__body">
                {category.id === "health-readings" ? (
                  <MeasurementEntryForm definition={MOCK_MEASUREMENT_DEFINITION} />
                ) : (
                  <p>Entry fields for this category are unavailable in this preview.</p>
                )}
              </div>
            </details>
          ))}
        </div>
      </section>
    </>
  );
}
