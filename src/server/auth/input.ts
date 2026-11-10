import "server-only";

const localPart = /^[A-Za-z0-9!#$%&'*+\-/=?^_`{|}~.]+$/;
const domainPart = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;

export function normalizeEmail(input: unknown): string | null {
  if (typeof input !== "string" || input.length > 254) return null;
  const [local, domain, ...rest] = input.trim().split("@");
  if (!local || !domain || rest.length || local.length > 64 || !localPart.test(local)) return null;
  if (local.startsWith(".") || local.endsWith(".") || local.includes("..")) return null;

  if (!/^[A-Za-z0-9.-]+$/.test(domain)) return null;
  const hostname = domain.toLowerCase();
  const labels = hostname.split(".");
  if (labels.length < 2 || !labels.every((label) => domainPart.test(label))) return null;
  return `${local}@${hostname}`;
}

export function readAuthForm(form: FormData, fields: readonly string[]): Record<string, string> | null {
  const values: Record<string, string> = Object.create(null);
  for (const [key, value] of form.entries()) {
    if (key.startsWith("$ACTION_")) continue;
    if (!fields.includes(key) || Object.hasOwn(values, key) || typeof value !== "string") return null;
    values[key] = value;
  }
  return fields.every((key) => Object.hasOwn(values, key)) ? values : null;
}
