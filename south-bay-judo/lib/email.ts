import { Resend } from "resend";

/**
 * Sends transactional registration and USJF reminder emails via Resend. Set up:
 *   1. Create a Resend account, verify the southbayjudo.com domain (adds a
 *      few DNS records — see README).
 *   2. Generate an API key.
 *   3. Set env vars: RESEND_API_KEY, and optionally EMAIL_FROM if you want
 *      a different "from" address than the default below.
 *
 * Registration receipts are explicitly marked "Payment pending" until a
 * real payment provider is connected. They confirm what was registered and
 * the amount due; they are not proof of payment.
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

export interface RegistrationReceiptStudent {
  name: string;
  session: string;
  classTime: string;
  sessionFee: number;
  giLabel?: string;
  giPrice?: number;
  membershipStatus: string;
}

export interface RegistrationReceiptItem {
  label: string;
  price: number;
}

export interface RegistrationReceipt {
  receiptNumber: string;
  registeredAt: string;
  paymentStatus: "Payment pending" | "Payment processing" | "Payment failed" | "Paid";
  students: RegistrationReceiptStudent[];
  gearItems: RegistrationReceiptItem[];
  total: number;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function money(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}

export async function sendRegistrationConfirmationEmail(opts: {
  to: string[];
  guardianName: string;
  receipt: RegistrationReceipt;
  idempotencyKey?: string;
}) {
  const resend = getResend();
  if (!resend) throw new Error("Email isn't connected yet — set RESEND_API_KEY.");

  const studentRows = opts.receipt.students
    .map(
      (student) => `
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid #e6e1d8;vertical-align:top">
            <strong>${escapeHtml(student.name)}</strong><br />
            <span style="color:#5f5a52;font-size:13px">${escapeHtml(student.session)} · ${escapeHtml(student.classTime)}</span>
          </td>
          <td style="padding:12px 0;border-bottom:1px solid #e6e1d8;text-align:right;vertical-align:top">${money(student.sessionFee)}</td>
        </tr>
        ${student.giLabel ? `<tr><td style="padding:8px 0 8px 18px;border-bottom:1px solid #e6e1d8;color:#5f5a52">Gi — ${escapeHtml(student.giLabel)}</td><td style="padding:8px 0;border-bottom:1px solid #e6e1d8;text-align:right">${money(student.giPrice || 0)}</td></tr>` : ""}`
    )
    .join("");

  const gearRows = opts.receipt.gearItems
    .map(
      (item) => `<tr><td style="padding:8px 0;border-bottom:1px solid #e6e1d8;color:#5f5a52">${escapeHtml(item.label)}</td><td style="padding:8px 0;border-bottom:1px solid #e6e1d8;text-align:right">${money(item.price)}</td></tr>`
    )
    .join("");

  const membershipNotice = opts.receipt.students.some((student) => student.membershipStatus === "none")
    ? `<div style="margin:24px 0;padding:14px 16px;background:#fff4ee;border-left:4px solid #9c2f1b;color:#612014"><strong>USJF membership needed</strong><br /><span style="font-size:14px">One or more students do not have a current USJF membership on file. Membership must be completed directly at <a href="https://www.usjf.com" style="color:#612014">usjf.org</a> before the first class.</span></div>`
    : "";

  const isPaid = opts.receipt.paymentStatus === "Paid";
  const heading = isPaid ? "Registration and payment confirmed" : "Registration confirmed";
  const statusDetail = isPaid
    ? "Your payment was received successfully."
    : "This receipt confirms registration details and the amount due. It is not proof of payment.";

  const html = `<!doctype html>
  <html><body style="margin:0;background:#f3f0e9;font-family:Arial,sans-serif;color:#171717">
    <div style="display:none;max-height:0;overflow:hidden">${heading} — receipt ${escapeHtml(opts.receipt.receiptNumber)}</div>
    <div style="max-width:620px;margin:0 auto;padding:28px 16px">
      <div style="background:#16191d;color:#fff;padding:28px">
        <div style="font-size:13px;letter-spacing:1.5px;text-transform:uppercase;color:#d8b45a">South Bay Judo</div>
        <h1 style="margin:8px 0 0;font-size:30px;line-height:1.1">${heading}</h1>
      </div>
      <div style="background:#fff;padding:28px">
        <p style="margin-top:0">Hi ${escapeHtml(opts.guardianName)},</p>
        <p>We received your registration. This email includes your registration receipt and class selections.</p>
        <div style="margin:24px 0;padding:14px 16px;background:#fff8df;border:1px solid #e8cf7b">
          <strong>${opts.receipt.paymentStatus}</strong><br />
          <span style="font-size:13px;color:#5f5a52">${statusDetail}</span>
        </div>
        <table style="width:100%;border-collapse:collapse;font-size:14px">
          <tr><td style="padding:0 0 10px;color:#5f5a52">Receipt</td><td style="padding:0 0 10px;text-align:right">${escapeHtml(opts.receipt.receiptNumber)}</td></tr>
          <tr><td style="padding:0 0 18px;color:#5f5a52">Registered</td><td style="padding:0 0 18px;text-align:right">${escapeHtml(opts.receipt.registeredAt)}</td></tr>
          ${studentRows}
          ${gearRows}
          <tr><td style="padding:18px 0 0;font-size:18px"><strong>Total due</strong></td><td style="padding:18px 0 0;text-align:right;font-size:22px"><strong>${money(opts.receipt.total)}</strong></td></tr>
        </table>
        ${membershipNotice}
        <p style="margin:26px 0 0;font-size:14px;color:#5f5a52">Questions? Reply to this email or contact South Bay Judo at (424) 392-4732.</p>
      </div>
      <p style="text-align:center;color:#777;font-size:12px;margin:18px 0">Wilson Park · Dee Hardison Sports Center · 2400 Jefferson St, Torrance, CA 90501</p>
    </div>
  </body></html>`;

  const studentLines = opts.receipt.students.flatMap((student) => [
    `${student.name} — ${student.session} — ${student.classTime}: ${money(student.sessionFee)}`,
    ...(student.giLabel ? [`  Gi — ${student.giLabel}: ${money(student.giPrice || 0)}`] : []),
  ]);
  const gearLines = opts.receipt.gearItems.map((item) => `${item.label}: ${money(item.price)}`);
  const text = `Hi ${opts.guardianName},\n\nWe received your South Bay Judo registration${isPaid ? " and payment" : ""}.\n\nReceipt: ${opts.receipt.receiptNumber}\nRegistered: ${opts.receipt.registeredAt}\nStatus: ${opts.receipt.paymentStatus}\n\n${[...studentLines, ...gearLines].join("\n")}\n\nTotal: ${money(opts.receipt.total)}\n\n${statusDetail}\n\nQuestions? Reply to this email or call (424) 392-4732.\n\nSouth Bay Judo`;

  const { error } = await resend.emails.send(
    {
      from: FROM_ADDRESS,
      to: opts.to,
      bcc: process.env.REGISTRATION_BCC || "info@southbayjudo.com",
      replyTo: "info@southbayjudo.com",
      subject: `South Bay Judo ${isPaid ? "payment" : "registration"} confirmed — ${opts.receipt.receiptNumber}`,
      html,
      text,
    },
    opts.idempotencyKey ? { idempotencyKey: opts.idempotencyKey } : undefined
  );

  if (error) throw new Error(error.message || "Failed to send registration confirmation.");
}

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
