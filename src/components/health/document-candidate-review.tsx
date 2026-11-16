"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import { cancelHealthDocumentAction, confirmHealthDocumentAction } from "@/app/document-actions";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import { healthRecordLabels, glucoseContextLabels, unitLabels } from "@/domain/health-records";
import type { ReviewCandidate } from "@/server/documents/service";

const fields = {
  blood_pressure: [["systolic", "Systolic"], ["diastolic", "Diastolic"]],
  blood_glucose: [["value", "Blood glucose"]],
  hba1c: [["value", "HbA1c"]],
  lipid_panel: [["totalCholesterol", "Total cholesterol"], ["hdl", "HDL"], ["ldl", "LDL"], ["triglycerides", "Triglycerides"]],
  weight: [["value", "Weight"]],
  waist_circumference: [["value", "Waist circumference"]],
} as const;

function CandidateFields({ candidate }: Readonly<{ candidate: ReviewCandidate }>) {
  const [decision, setDecision] = useState<"pending" | "include" | "remove">("pending");
  const included = decision === "include";
  const [occurredAt, setOccurredAt] = useState("");
  const prefix = `${candidate.id}:`;
  const formFields: Record<string, string | null> = {
    systolic: candidate.value, diastolic: candidate.secondValue, value: candidate.value,
    totalCholesterol: candidate.totalCholesterol, hdl: candidate.hdl, ldl: candidate.ldl, triglycerides: candidate.triglycerides,
  };
  const units = candidate.recordType === "blood_glucose" || candidate.recordType === "lipid_panel" ? ["mmol_l", "mg_dl"]
    : candidate.recordType === "weight" ? ["kg", "lb"] : candidate.recordType === "waist_circumference" ? ["cm", "in"] : [];
  return <fieldset className="document-candidate">
    <legend>{healthRecordLabels[candidate.recordType]}{candidate.sourcePage ? ` · page ${candidate.sourcePage}` : ""}</legend>
    <div className="document-candidate__choices" role="group" aria-label={`Decision for ${healthRecordLabels[candidate.recordType]}`}>
      <label className="document-candidate__choice">
        <input type="radio" name={`${prefix}selection`} value="include" checked={included} required onChange={() => setDecision("include")} />
        Include this item
      </label>
      <label className="document-candidate__choice">
        <input type="radio" name={`${prefix}selection`} value="remove" checked={decision === "remove"} required onChange={() => setDecision("remove")} />
        Remove this item
      </label>
    </div>
    <p className="muted">{included ? "Check and edit the fields below before confirming." : decision === "remove" ? "This item will not be saved." : "Choose whether to include or remove this possible item."}</p>
    <div className="measurement-form__grid">
      {fields[candidate.recordType].map(([key, label]) => <div className="field" key={key}>
        <label htmlFor={`${candidate.id}-${key}`}>{label}</label>
        <input id={`${candidate.id}-${key}`} name={`${prefix}${key}`} type="text" inputMode="decimal" defaultValue={formFields[key] ?? ""} disabled={!included} />
      </div>)}
      {units.length > 0 && <div className="field"><label htmlFor={`${candidate.id}-unit`}>Unit</label>
        <select id={`${candidate.id}-unit`} name={`${prefix}unit`} defaultValue={candidate.unit ?? ""} disabled={!included}>
          {units.map((unit) => <option key={unit} value={unit}>{unitLabels[unit as keyof typeof unitLabels]}</option>)}
        </select></div>}
      {candidate.recordType === "blood_glucose" && <div className="field"><label htmlFor={`${candidate.id}-context`}>Context</label>
        <select id={`${candidate.id}-context`} name={`${prefix}context`} defaultValue={candidate.glucoseContext ?? "not_specified"} disabled={!included}>
          {Object.entries(glucoseContextLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
        </select></div>}
      <div className="field"><label htmlFor={`${candidate.id}-occurred-local`}>Date and time taken</label>
        <input id={`${candidate.id}-occurred-local`} type="datetime-local" step="0.001" value={occurredAt}
          onChange={(event) => setOccurredAt(event.currentTarget.value)} disabled={!included} required={included} />
        <input type="hidden" name={`${prefix}occurredAt`} value={occurredAt && Number.isFinite(new Date(occurredAt).getTime()) ? new Date(occurredAt).toISOString() : ""} />
        <p className="muted">Enter the date and time shown on your device. Do not assume the document date is the reading time.</p>
      </div>
    </div>
  </fieldset>;
}

export function DocumentCandidateReview({ uploadId, csrf, candidates }: Readonly<{ uploadId: string; csrf: string; candidates: ReviewCandidate[] }>) {
  const [state, action, pending] = useActionState(confirmHealthDocumentAction, null);
  return <>
    <form action={action} className="document-review-form" aria-busy={pending}>
      <input type="hidden" name="csrf" value={csrf} />
      <input type="hidden" name="uploadId" value={uploadId} />
      {state?.error && <Notice tone="critical">{state.error} {state.verificationRequired && <Link href="/app/verify-email">Verify your email</Link>}</Notice>}
      {candidates.map((candidate) => <CandidateFields key={candidate.id} candidate={candidate} />)}
      <p>Confirm only the items you have checked. Confirmation does not mean clinical verification.</p>
      <Button type="submit" disabled={pending}>{pending ? "Saving…" : "Confirm selected information"}</Button>
    </form>
    <form action={cancelHealthDocumentAction} className="document-cancel-form">
      <input type="hidden" name="csrf" value={csrf} />
      <input type="hidden" name="uploadId" value={uploadId} />
      <Button type="submit" variant="text">Cancel upload</Button>
    </form>
  </>;
}
