import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

export interface ReturningClaims {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  email: string;
  expiresAt: number;
}

function secretKey(): Buffer {
  const value = process.env.SBJ_RETURNING_LOOKUP_KEY || "";
  if (!/^[a-f0-9]{64}$/i.test(value)) {
    throw new Error("Returning-student email verification is not configured.");
  }
  return Buffer.from(value, "hex");
}

/**
 * Authenticated AES-GCM encryption keeps private data and address out of
 * plaintext magic-link URLs. A token expires after 20 minutes and has no
 * permission to change student or payment records.
 */
export function createReturningToken(claims: Omit<ReturningClaims, "expiresAt">) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", secretKey(), iv);
  const plaintext = Buffer.from(JSON.stringify({
    ...claims, expiresAt: Date.now() + 20 * 60_000,
  }), "utf8");
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString("base64url");
}

export function readReturningToken(token: unknown): ReturningClaims | null {
  if (typeof token !== "string" || token.length < 45 || token.length > 2000 ||
      !/^[a-zA-Z0-9_-]+$/.test(token)) return null;
  try {
    const data = Buffer.from(token, "base64url");
    if (data.length <= 28) return null;
    const iv = data.subarray(0, 12);
    const tag = data.subarray(12, 28);
    const ciphertext = data.subarray(28);
    const decipher = createDecipheriv("aes-256-gcm", secretKey(), iv);
    decipher.setAuthTag(tag);
    const claim = JSON.parse(Buffer.concat([
      decipher.update(ciphertext), decipher.final(),
    ]).toString("utf8")) as ReturningClaims;
    if (!claim || typeof claim.firstName !== "string" ||
        typeof claim.lastName !== "string" ||
        typeof claim.dateOfBirth !== "string" ||
        typeof claim.email !== "string" ||
        !Number.isFinite(claim.expiresAt) ||
        claim.expiresAt <= Date.now() ||
        claim.expiresAt > Date.now() + 20 * 60_000) return null;
    return claim;
  } catch {
    return null;
  }
}
