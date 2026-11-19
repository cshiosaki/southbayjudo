import { createHmac, timingSafeEqual } from "node:crypto";

// A token is bound to an email and one 10-minute issuance bucket.
// Every request in the same bucket produces an identical link, so repeated
// emails can be idempotent. A token lives for at most 30 minutes.
const BUCKET_MS = 10 * 60 * 1000;
function key() {
  const value = process.env.SBJ_RETURNING_LOOKUP_KEY;
  if (!value || !/^[a-f0-9]{64}$/i.test(value)) {
    throw new Error("Instructor email verification is not configured.");
  }
  return Buffer.from(value, "hex");
}
function signature(payload: string) {
  return createHmac("sha256", key()).update("sbj-instructor-v1|" + payload).digest("base64url");
}
export function issueInstructorToken(emailRaw: string) {
  const email = emailRaw.trim().toLowerCase();
  const bucket = Math.floor(Date.now() / BUCKET_MS);
  const payload = Buffer.from(JSON.stringify({ email, bucket })).toString("base64url");
  return { token: payload + "." + signature(payload), idempotencyKey: "instructor-" + signature(payload).slice(0, 40) };
}
export function verifiedInstructorEmail(token: unknown) {
  if (typeof token !== "string" || token.length > 1000 || token.length < 30) return null;
  const parts = token.split(".");
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
  const expected = Buffer.from(signature(parts[0]));
  const provided = Buffer.from(parts[1]);
  if (expected.length !== provided.length || !timingSafeEqual(expected, provided)) return null;
  try {
    const data = JSON.parse(Buffer.from(parts[0], "base64url").toString("utf8"));
    if (typeof data.email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email) ||
        typeof data.bucket !== "number" || !Number.isSafeInteger(data.bucket)) return null;
    const age = Date.now() - data.bucket * BUCKET_MS;
    if (age < 0 || age >= 30 * 60 * 1000) return null;
    return data.email as string;
  } catch {
    return null;
  }
}
