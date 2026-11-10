import "server-only";

import { randomBytes } from "node:crypto";
import { hash, verify, type Options } from "@node-rs/argon2";
import { dictionary } from "@zxcvbn-ts/language-common";

export const ARGON2_OPTIONS = {
  // The binding declares these enum values as ambient const enums, which isolated modules cannot import as values.
  algorithm: 2, // Argon2id
  version: 1, // v0x13
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
  outputLen: 32,
} as const satisfies Options;

function normalizedPassword(input: unknown): string | null {
  if (typeof input !== "string" || input.length === 0 || input.length > 256 || !input.isWellFormed()) return null;
  const normalized = input.normalize("NFC");
  if ([...normalized].length > 128
    || [...normalized].some((character) => character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127)) return null;
  return normalized;
}

const lookupKey = (password: string) => password.normalize("NFKC").toLowerCase();
const blockedPasswords = new Set(dictionary["passwords-common"].map(lookupKey));
const maxConcurrentJobs = 4;
let activeJobs = 0;

// This is an offline-generated synthetic verifier, never an account credential.
const dummyHash = "$argon2id$v=19$m=19456,t=2,p=1$19ZwSB2sc7g6ev3RETGRMQ$U8UuEY0HZ7ZnG5oFG2Q+RuDh2VkVZCLLPJUhEhtYG8E";

export function isPasswordInputBounded(input: unknown): input is string {
  return normalizedPassword(input) !== null;
}

export function validateNewPassword(input: unknown): "valid" | "length" | "blocked" | "invalid" {
  if (typeof input !== "string" || input.length > 256 || !input.isWellFormed()) return "invalid";
  const normalized = normalizedPassword(input);
  if (!normalized || [...normalized].length < 15 || [...normalized].length > 128) return "length";
  return blockedPasswords.has(lookupKey(normalized)) ? "blocked" : "valid";
}

async function withHashSlot<T>(work: () => Promise<T>): Promise<T> {
  if (activeJobs >= maxConcurrentJobs) throw new Error("Authentication hash capacity unavailable.");
  activeJobs++;
  try {
    return await work();
  } finally {
    activeJobs--;
  }
}

export function hashPassword(password: string): Promise<string> {
  const normalized = normalizedPassword(password);
  if (!normalized) throw new Error("Invalid authentication input.");
  return withHashSlot(() => hash(normalized, { ...ARGON2_OPTIONS, salt: randomBytes(16) }));
}

function readableParameters(encoded: string | undefined) {
  const match = encoded?.match(/^\$argon2id\$v=19\$m=(\d{1,5}),t=([1-4]),p=([12])\$([A-Za-z0-9+/]{11,43})\$([A-Za-z0-9+/]{22,86})$/);
  if (!match) return null;
  const memoryCost = Number(match[1]);
  if (memoryCost < 8192 || memoryCost > 65_536) return null;
  const salt = Buffer.from(match[4], "base64");
  const output = Buffer.from(match[5], "base64");
  if (salt.length < 8 || output.length < 16 || salt.toString("base64").replace(/=+$/, "") !== match[4]
    || output.toString("base64").replace(/=+$/, "") !== match[5]) return null;
  return { memoryCost, timeCost: Number(match[2]), parallelism: Number(match[3]), outputLen: output.length };
}

export async function verifyPassword(password: string, encoded?: string): Promise<{ valid: boolean; needsRehash: boolean }> {
  const normalized = normalizedPassword(password);
  if (!normalized) return { valid: false, needsRehash: false };
  const parameters = readableParameters(encoded);
  const matches = await withHashSlot(() => verify(parameters && encoded ? encoded : dummyHash, normalized));
  if (!parameters || !matches) return { valid: false, needsRehash: false };
  const { memoryCost, timeCost, parallelism, outputLen } = parameters;
  const canUpgrade = memoryCost <= ARGON2_OPTIONS.memoryCost && timeCost <= ARGON2_OPTIONS.timeCost
    && parallelism === ARGON2_OPTIONS.parallelism && outputLen <= ARGON2_OPTIONS.outputLen;
  return { valid: true, needsRehash: canUpgrade && (
    memoryCost < ARGON2_OPTIONS.memoryCost || timeCost < ARGON2_OPTIONS.timeCost || outputLen < ARGON2_OPTIONS.outputLen
  ) };
}
