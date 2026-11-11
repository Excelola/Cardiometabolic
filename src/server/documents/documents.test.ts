import { Buffer } from "node:buffer";
import { readFileSync } from "node:fs";

import { describe, expect, it, vi } from "vitest";

import { MAX_DOCUMENT_BYTES, classifyPdfFailure, validateDocument } from "./file-validation";
import { mapOcrCandidates } from "./mapper";
import { developmentProviders, FakeOcrProvider, FakeScanner, GoogleDocumentAiOcr, isDevelopmentDocumentUploadEnabled, MemoryDocumentStore } from "./providers";

export const syntheticPng = readFileSync(new URL("./fixtures/synthetic.png", import.meta.url));
const syntheticJpeg = readFileSync(new URL("./fixtures/synthetic.jpg", import.meta.url));
const syntheticReport = readFileSync(new URL("./fixtures/synthetic-report.pdf", import.meta.url));
const syntheticEncrypted = readFileSync(new URL("./fixtures/synthetic-encrypted.pdf", import.meta.url));

function syntheticPdf(pages: number): Buffer {
  const objects = ["<< /Type /Catalog /Pages 2 0 R >>",
    `<< /Type /Pages /Kids [${Array.from({ length: pages }, (_, index) => `${index + 3} 0 R`).join(" ")}] /Count ${pages} >>`,
    ...Array.from({ length: pages }, () => "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 100 100] >>")];
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  for (const [index, body] of objects.entries()) {
    offsets.push(Buffer.byteLength(pdf));
    pdf += `${index + 1} 0 obj\n${body}\nendobj\n`;
  }
  const xref = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets.slice(1)) pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(pdf);
}

describe("health-document boundaries", () => {
  it("accepts a synthetic PNG by content and rejects type mismatch and oversized input", async () => {
    expect(await validateDocument(syntheticPng, "image/png")).toMatchObject({ mime: "image/png", pageCount: 1 });
    expect(await validateDocument(syntheticJpeg, "image/jpeg")).toMatchObject({ mime: "image/jpeg", pageCount: 1 });
    const corruptPng = Buffer.from(syntheticPng);
    corruptPng[66] ^= 0xff;
    expect(await validateDocument(corruptPng, "image/png")).toBe("unreadable_file");
    expect(await validateDocument(syntheticPng, "application/pdf")).toBe("unreadable_file");
    expect(await validateDocument(Buffer.alloc(MAX_DOCUMENT_BYTES + 1), "image/png")).toBe("file_too_large");
    expect(await validateDocument(Buffer.from("PK\x03\x04"), "application/zip")).toBe("unsupported_file");
    expect(await validateDocument(Buffer.from("%PDF-1.4\ncorrupt"), "application/pdf")).toBe("unreadable_file");
  }, 30_000); // The first native image decode and PDF worker load can be slow on Windows CI.

  it("counts synthetic PDF pages and rejects a document over the approved limit", async () => {
    expect(await validateDocument(syntheticReport, "application/pdf")).toMatchObject({ mime: "application/pdf", pageCount: 1 });
    expect(await validateDocument(syntheticPdf(1), "application/pdf")).toMatchObject({ mime: "application/pdf", pageCount: 1 });
    expect(await validateDocument(syntheticPdf(15), "application/pdf")).toMatchObject({ pageCount: 15 });
    expect(await validateDocument(syntheticPdf(16), "application/pdf")).toBe("too_many_pages");
    expect(await validateDocument(syntheticEncrypted, "application/pdf")).toBe("encrypted_pdf");
  });

  it("classifies a password-protected PDF parser failure without echoing provider detail", () => {
    const locked = new Error("Synthetic password required");
    locked.name = "PasswordException";
    expect(classifyPdfFailure(locked)).toBe("encrypted_pdf");
    expect(classifyPdfFailure(new Error("Synthetic parse failure"))).toBe("unreadable_file");
  });

  it("maps only explicitly labelled supported synthetic values", () => {
    const mapped = mapOcrCandidates({ pages: [{ number: 1, text: [
      "Blood pressure: 121/81 mmHg", "Blood glucose (fasting): 5.2 mmol/L", "HbA1c: 6.1%",
      "Total cholesterol: 4.4 mmol/L", "HDL: 1.1 mmol/L", "Weight: 70 kg", "Waist circumference: 80 cm",
      "Diagnosis: synthetic condition", "Medication: synthetic tablet", "Address: Synthetic Street",
    ].join("\n") }] });
    expect(mapped.map((item) => item.recordType)).toEqual([
      "blood_pressure", "blood_glucose", "hba1c", "weight", "waist_circumference", "lipid_panel",
    ]);
    expect(mapped.some((item) => JSON.stringify(item).includes("Diagnosis"))).toBe(false);
    expect(mapped.find((item) => item.recordType === "blood_glucose")?.glucoseContext).toBe("fasting");
    expect(mapped.find((item) => item.recordType === "lipid_panel")?.hdl).toBe("1.1");
  });

  it("uses explicit scanner states and deletes temporary synthetic bytes", async () => {
    expect(await new FakeScanner("clean").scan(syntheticPng, "image/png")).toBe("clean");
    expect(await new FakeScanner("infected").scan(syntheticPng, "image/png")).toBe("infected");
    expect(await new FakeScanner("unavailable").scan(syntheticPng, "image/png")).toBe("unavailable");
    const store = new MemoryDocumentStore();
    const key = await store.put(syntheticPng);
    expect(store.count()).toBe(1);
    await store.delete(key);
    expect(store.count()).toBe(0);
    expect((await new FakeOcrProvider([{ number: 1, text: "Weight: 70 kg" }]).extract(syntheticPng, "image/png")).pages).toHaveLength(1);
  });

  it("requires an EU Google processor and gates the controlled upload flow by environment", () => {
    expect(() => new GoogleDocumentAiOcr("projects/synthetic/locations/us/processors/synthetic")).toThrow();
    expect(() => new GoogleDocumentAiOcr("projects/synthetic/locations/eu/processors/synthetic")).not.toThrow();
    try {
      vi.stubEnv("NODE_ENV", "production");
      vi.stubEnv("HILERA_DOCUMENT_DEV_FAKE_OCR", "ready");
      expect(isDevelopmentDocumentUploadEnabled()).toBe(false);
      expect(developmentProviders()).toBeNull();

      vi.stubEnv("NODE_ENV", "test");
      vi.stubEnv("HILERA_DOCUMENT_DEV_FAKE_OCR", "");
      expect(isDevelopmentDocumentUploadEnabled()).toBe(false);
      expect(developmentProviders()).toBeNull();

      vi.stubEnv("HILERA_DOCUMENT_DEV_FAKE_OCR", "ready");
      expect(isDevelopmentDocumentUploadEnabled()).toBe(true);
      expect(developmentProviders()).not.toBeNull();
    } finally {
      vi.unstubAllEnvs();
    }
  });
});
