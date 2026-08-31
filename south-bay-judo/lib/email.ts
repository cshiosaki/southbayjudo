import { Resend } from "resend";

/**
 * Sends the USJF-membership-reminder email via Resend. Set up:
 *   1. Create a Resend account, verify the southbayjudo.com domain (adds a
 *      few DNS records — see README).
 *   2. Generate an API key.
 *   3. Set env vars: RESEND_API_KEY, and optionally EMAIL_FROM if you want
 *      a different "from" address than the default below.
 *
 * This is intentionally the ONLY email this app sends right now. The
 * full registration-confirmation-with-receipt email is meant to go out
 * once the real Stripe checkout exists — sending a "receipt" before
 * there's a real charge would be misleading. This reminder isn't tied to
 * payment at all, so it's safe to build ahead of Stripe.
 */

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

export function emailConfigured() {
  return !!process.env.RESEND_API_KEY;
}

const FROM_ADDRESS = process.env.EMAIL_FROM || "South Bay Judo <info@southbayjudo.com>";

export type UsjfReminderReason = "missing" | "incomplete" | "expired";

export async function sendUsjfReminderEmail(opts: {
  to: string;
  guardianName: string;
  studentName: string;
  reason: UsjfReminderReason;
  expiresDate?: string;
}) {
  const resend = getResend();
  if (!resend) throw new Error("Email isn't connected yet — set RESEND_API_KEY.");

  const reasonText =
    opts.reason === "expired"
      ? `${opts.studentName}'s USJF membership expired on ${opts.expiresDate}.`
      : opts.reason === "incomplete"
      ? `We have ${opts.studentName} marked as having a current USJF membership, but we don't have their membership number on file yet.`
      : `We don't have a current USJF membership on file for ${opts.studentName}.`;

  const body = `Hi ${opts.guardianName},

${reasonText}

USJF membership is required for insurance coverage before ${opts.studentName} can participate in class. Membership is purchased directly through usjf.org — it isn't sold through our registration site.

Once you have a current membership number, just reply to this email or let an instructor know so we can update our records.

Thank you,
South Bay Judo`;

  const { error } = await resend.emails.send({
    from: FROM_ADDRESS,
    to: opts.to,
    subject: `Action needed: USJF membership for ${opts.studentName}`,
    text: body,
  });

  if (error) throw new Error(error.message || "Failed to send email.");
}
