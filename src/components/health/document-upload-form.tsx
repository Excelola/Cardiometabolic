"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";

export function DocumentUploadForm({ csrf }: Readonly<{ csrf: string }>) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/health-documents", {
        method: "POST",
        headers: { "x-hilera-csrf": csrf },
        body: new FormData(event.currentTarget),
        cache: "no-store",
      });
      const result: unknown = await response.json();
      if (response.ok && result && typeof result === "object" && "id" in result && typeof result.id === "string"
        && /^[0-9a-f-]{36}$/i.test(result.id)) {
        router.push(`/app/documents/${result.id}/review`);
        return;
      }
      setError(result && typeof result === "object" && "error" in result && typeof result.error === "string"
        ? result.error : "Document upload is unavailable right now. Please try again later.");
    } catch {
      setError("Document upload is unavailable right now. Please try again later.");
    } finally {
      setPending(false);
    }
  }
  return (
    <form method="post" action="/api/health-documents" onSubmit={submit} encType="multipart/form-data" className="document-upload-form">
      <div className="field">
        <label htmlFor="health-document-file">Choose one health document</label>
        <input id="health-document-file" name="file" type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" required aria-describedby="document-file-help" />
        <p id="document-file-help" className="muted">PDF, JPEG or PNG · up to 10 MB · PDF up to 15 pages. Password-protected PDFs are not supported.</p>
      </div>
      <p>HILERA looks only for supported health information. You must review and explicitly confirm anything found before it is saved.</p>
      {error && <Notice tone="critical">{error}</Notice>}
      <Button type="submit" disabled={pending}>{pending ? "Checking document…" : "Upload health document"}</Button>
    </form>
  );
}
