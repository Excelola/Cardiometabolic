import "server-only";

import type { DocumentMime } from "./file-validation";

export type ScannerResult = "clean" | "infected" | "unavailable";
export interface MalwareScanner { scan(bytes: Buffer, mime: DocumentMime): Promise<ScannerResult> }
export interface TemporaryDocumentStore {
  put(bytes: Buffer): Promise<string>;
  delete(key: string): Promise<void>;
}
export type OcrPage = { number: number; text: string };
export type NormalizedOcr = { pages: OcrPage[]; requestCategory?: string };
export interface DocumentOcrProvider {
  extract(bytes: Buffer, mime: DocumentMime): Promise<NormalizedOcr>;
}

/** Explicitly configured synthetic development adapter. Never select this in production. */
export class FakeScanner implements MalwareScanner {
  constructor(private readonly result: ScannerResult) {}
  async scan(_bytes: Buffer, _mime: DocumentMime): Promise<ScannerResult> { void _bytes; void _mime; return this.result; }
}

/** Keeps only synthetic bytes in process memory for tests. No production durable-file strategy is inferred. */
export class MemoryDocumentStore implements TemporaryDocumentStore {
  private readonly documents = new Map<string, Buffer>();
  async put(bytes: Buffer) {
    const key = crypto.randomUUID();
    this.documents.set(key, Buffer.from(bytes));
    return key;
  }
  async delete(key: string) { this.documents.delete(key); }
  count() { return this.documents.size; }
}

export class FakeOcrProvider implements DocumentOcrProvider {
  constructor(private readonly pages: OcrPage[]) {}
  async extract(_bytes: Buffer, _mime: DocumentMime): Promise<NormalizedOcr> { void _bytes; void _mime; return { pages: this.pages }; }
}

export class GoogleDocumentAiOcr implements DocumentOcrProvider {
  constructor(private readonly processor: string) {
    if (!/^projects\/[A-Za-z0-9_-]+\/locations\/eu\/processors\/[A-Za-z0-9_-]+$/.test(processor)) {
      throw new Error("An EU Document AI processor must be configured.");
    }
  }

  async extract(bytes: Buffer, mime: DocumentMime): Promise<NormalizedOcr> {
    const { v1 } = await import("@google-cloud/documentai");
    const client = new v1.DocumentProcessorServiceClient({ apiEndpoint: "eu-documentai.googleapis.com" });
    try {
      const [response] = await client.processDocument({ name: this.processor, rawDocument: { content: bytes, mimeType: mime } });
      const document = response.document;
      const text = document?.text ?? "";
      const pages = document?.pages?.map((page, index) => {
        const segments = page.layout?.textAnchor?.textSegments ?? [];
        const pageText = segments.map((segment) => text.slice(Number(segment.startIndex ?? 0), Number(segment.endIndex ?? 0))).join("");
        return { number: index + 1, text: pageText };
      }) ?? [];
      return { pages: pages.length ? pages : [{ number: 1, text }] };
    } finally {
      await client.close();
    }
  }
}

export function developmentProviders(): { scanner: MalwareScanner; ocr: DocumentOcrProvider } | null {
  const fixture = process.env.HILERA_DOCUMENT_DEV_FAKE_OCR;
  if (process.env.NODE_ENV === "production" || !["ready", "empty"].includes(fixture ?? "")) return null;
  return {
    scanner: new FakeScanner("clean"),
    ocr: new FakeOcrProvider([{ number: 1, text: fixture === "ready" ? "Blood pressure: 120/80 mmHg\nWeight: 70 kg" : "Unsupported synthetic text" }]),
  };
}
