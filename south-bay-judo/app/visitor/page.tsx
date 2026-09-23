"use client";

import { useState } from "react";

/**
 * DEMO MODE — visitor/drop-in check-in. Client-side only for the design
 * review; the full version posts to /api/visitor and files the signed
 * waiver to Google Drive (see git history / original scaffold).
 */
const MEDICAL_ACK_TEXT = `I acknowledge that judo involves physical contact and carries inherent risk of injury. I release South Bay Judo, the City of Torrance, and their instructors and volunteers from liability for injuries sustained during normal participation, except in cases of gross negligence. I consent to emergency medical treatment if I cannot be reached.`;

export default function VisitorPage() {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    homeDojo: "",
    membershipOrg: "",
    membershipId: "",
    emergencyContact: "",
    emergencyPhone: "",
    hasMedicalConditions: "" as "yes" | "no" | "",
    medicalNotes: "",
  });
  const [passPurchased, setPassPurchased] = useState(false);
  const [isMinor, setIsMinor] = useState<"yes" | "no" | "">("");
  const [guardianRelationship, setGuardianRelationship] = useState("");
  const [signedByName, setSignedByName] = useState("");
  const [done, setDone] = useState(false);

  const needsOneMonthPass = form.membershipOrg === "USJF_1_MONTH";
  const hasAcceptedMembership =
    form.membershipOrg === "USJF" ||
    form.membershipOrg === "USA_JUDO" ||
    (needsOneMonthPass && passPurchased);

  if (done) {
    return (
      <main className="max-w-xl mx-auto px-6 py-24 text-center">
        <p className="font-display text-gold text-lg mb-2">Demo submission received</p>
        <h1 className="font-display text-5xl mb-6">You're all set</h1>
        <p className="text-ink/70">
          In the live version, your waiver would now be filed to Google Drive. Welcome to South Bay
          Judo — head over to the mat.
        </p>
      </main>
    );
  }

  return (
    <main className="max-w-xl mx-auto px-6 py-16">
      <h1 className="font-display text-5xl mb-2">Visitor Check-In</h1>
      <p className="text-ink/60 mb-10">
        For students dropping in from another dojo. Visitors must have a current USJF or USA Judo
        membership. If you have neither, a USJF one-month membership is required before checking in.
      </p>

      <fieldset>
        <input placeholder="Visiting student's first name" onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
        <input placeholder="Visiting student's last name" onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
        <label className="block text-sm text-ink/70">
          Home dojo/club or Unattached
          <input
            required
            placeholder="Home dojo/club or Unattached"
            value={form.homeDojo}
            onChange={(e) => setForm({ ...form, homeDojo: e.target.value })}
          />
        </label>

        <div className="mb-5">
          <p className="font-display text-lg mb-1">Judo membership</p>
          <p className="text-sm text-ink/65 mb-3">
            Select the membership that covers this visit.
          </p>
          <div className="space-y-3">
            <label className={`flex items-start gap-3 border p-4 cursor-pointer ${form.membershipOrg === "USJF" ? "border-belt bg-card" : "border-ink/20 bg-card/50"}`}>
              <input
                name="membershipOrg"
                type="radio"
                checked={form.membershipOrg === "USJF"}
                onChange={() => {
                  setForm({ ...form, membershipOrg: "USJF", membershipId: "" });
                  setPassPurchased(false);
                }}
              />
              <span>
                <strong className="block font-medium">Current USJF membership</strong>
                <span className="block text-sm text-ink/60">Enter the student's current USJF member number below.</span>
              </span>
            </label>

            <label className={`flex items-start gap-3 border p-4 cursor-pointer ${form.membershipOrg === "USA_JUDO" ? "border-belt bg-card" : "border-ink/20 bg-card/50"}`}>
              <input
                name="membershipOrg"
                type="radio"
                checked={form.membershipOrg === "USA_JUDO"}
                onChange={() => {
                  setForm({ ...form, membershipOrg: "USA_JUDO", membershipId: "" });
                  setPassPurchased(false);
                }}
              />
              <span>
                <strong className="block font-medium">Current USA Judo membership</strong>
                <span className="block text-sm text-ink/60">Enter the student's current USA Judo member number below.</span>
              </span>
            </label>

            <label className={`flex items-start gap-3 border p-4 cursor-pointer ${needsOneMonthPass ? "border-belt bg-card" : "border-ink/20 bg-card/50"}`}>
              <input
                name="membershipOrg"
                type="radio"
                checked={needsOneMonthPass}
                onChange={() => {
                  setForm({ ...form, membershipOrg: "USJF_1_MONTH", membershipId: "" });
                  setPassPurchased(false);
                }}
              />
              <span>
                <strong className="block font-medium">I need a USJF one-month membership</strong>
                <span className="block text-sm text-ink/60">
                  Required for visitors who do not currently have USJF or USA Judo membership.
                </span>
              </span>
            </label>
          </div>
        </div>

        {form.membershipOrg && (
          <div className="mb-5">
            {needsOneMonthPass && (
              <div className="border border-belt/40 bg-card p-4 mb-3">
                <p className="font-display text-lg text-belt mb-2">Purchase your USJF membership first</p>
                <p className="text-sm text-ink/70 mb-3">
                  Complete the USJF one-month membership process before finishing visitor check-in.
                </p>
                <a
                  href="https://www.usjf.com/membership-program/short-membership/"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block bg-belt text-card px-4 py-2 font-display tracking-wide"
                >
                  Open USJF membership page
                </a>
                <label className="mt-4 flex items-start gap-3 text-sm">
                  <input
                    type="checkbox"
                    checked={passPurchased}
                    onChange={(e) => setPassPurchased(e.target.checked)}
                  />
                  <span>I have completed the required USJF one-month membership.</span>
                </label>
              </div>
            )}

            <input
              required
              placeholder={
                form.membershipOrg === "USA_JUDO"
                  ? "USA Judo membership ID"
                  : needsOneMonthPass
                    ? "USJF membership ID from one-month membership"
                    : "USJF membership ID"
              }
              value={form.membershipId}
              onChange={(e) => setForm({ ...form, membershipId: e.target.value })}
            />
          </div>
        )}

        <input placeholder="Emergency contact name" onChange={(e) => setForm({ ...form, emergencyContact: e.target.value })} />
        <input placeholder="Emergency contact phone" onChange={(e) => setForm({ ...form, emergencyPhone: e.target.value })} />
      </fieldset>

      <div className="mb-6">
        <p className="font-display text-lg mb-1">Medical information</p>
        <p className="text-sm text-ink/65 mb-3">
          Does the visiting student have any medical conditions, allergies, injuries, medications, or physical limitations that instructors should know about?
        </p>
        <div className="grid sm:grid-cols-2 gap-3">
          <label className={`flex items-center gap-3 border p-4 cursor-pointer ${form.hasMedicalConditions === "no" ? "border-belt bg-card" : "border-ink/20 bg-card/50"}`}>
            <input
              name="hasMedicalConditions"
              type="radio"
              checked={form.hasMedicalConditions === "no"}
              onChange={() => setForm({ ...form, hasMedicalConditions: "no", medicalNotes: "" })}
            />
            <strong className="font-medium">No</strong>
          </label>
          <label className={`flex items-center gap-3 border p-4 cursor-pointer ${form.hasMedicalConditions === "yes" ? "border-belt bg-card" : "border-ink/20 bg-card/50"}`}>
            <input
              name="hasMedicalConditions"
              type="radio"
              checked={form.hasMedicalConditions === "yes"}
              onChange={() => setForm({ ...form, hasMedicalConditions: "yes" })}
            />
            <strong className="font-medium">Yes</strong>
          </label>
        </div>
        {form.hasMedicalConditions === "yes" && (
          <textarea
            required
            placeholder="Please explain the condition, allergy, injury, medication, or limitation"
            value={form.medicalNotes}
            onChange={(e) => setForm({ ...form, medicalNotes: e.target.value })}
            className="mt-3 min-h-28"
          />
        )}
      </div>

      <div className="mb-6">
        <p className="font-display text-lg mb-3">Student age</p>
        <div className="grid sm:grid-cols-2 gap-3 mb-3">
          <label className={`flex items-start gap-3 border p-4 cursor-pointer transition-colors ${isMinor === "no" ? "border-belt bg-card" : "border-ink/20 bg-card/50"}`}>
            <input name="studentAge" type="radio" checked={isMinor === "no"} onChange={() => setIsMinor("no")} />
            <span>
              <strong className="block font-medium">18 or older</strong>
              <span className="block text-sm text-ink/60">Student signs the waiver</span>
            </span>
          </label>
          <label className={`flex items-start gap-3 border p-4 cursor-pointer transition-colors ${isMinor === "yes" ? "border-belt bg-card" : "border-ink/20 bg-card/50"}`}>
            <input name="studentAge" type="radio" checked={isMinor === "yes"} onChange={() => setIsMinor("yes")} />
            <span>
              <strong className="block font-medium">Under 18</strong>
              <span className="block text-sm text-ink/60">Parent or guardian signs</span>
            </span>
          </label>
        </div>
        {isMinor === "yes" && (
          <input
            placeholder="Relationship to student (e.g. Parent, Guardian)"
            value={guardianRelationship}
            onChange={(e) => setGuardianRelationship(e.target.value)}
          />
        )}
      </div>

      <div className="bg-card border border-ink/15 p-4 text-sm leading-relaxed mb-5">
        {MEDICAL_ACK_TEXT}
      </div>
      <input
        placeholder={isMinor === "yes" ? "Parent/guardian's full legal name to sign" : "Type your full legal name to sign"}
        value={signedByName}
        onChange={(e) => setSignedByName(e.target.value)}
        className="mb-2"
      />
      <div className="mb-3 min-h-24 border border-ink/25 bg-card px-5 py-4">
        <p className={`font-signature text-4xl leading-tight ${signedByName ? "text-ink" : "text-ink/30"}`}>
          {signedByName || "Your signature appears here"}
        </p>
        <div className="mt-2 border-t border-ink/35 pt-1 text-xs text-ink/50">Electronic signature</div>
      </div>
      <p className="mb-3 text-xs text-ink/60">
        By typing your full legal name, you agree that it serves as your electronic signature on this waiver and visitor check-in.
      </p>
      {isMinor === "yes" && (
        <p className="text-xs text-ink/50 mb-2">
          As the parent/guardian, you're signing on behalf of {form.firstName || "the student"}.
        </p>
      )}
      <p className="text-xs text-ink/50 mb-4">
        Date: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
      </p>
      <button
        disabled={
          !form.firstName ||
          !form.lastName ||
          !form.homeDojo ||
          !hasAcceptedMembership ||
          !form.membershipId.trim() ||
          !form.hasMedicalConditions ||
          (form.hasMedicalConditions === "yes" && !form.medicalNotes.trim()) ||
          !signedByName.trim() ||
          !isMinor ||
          (isMinor === "yes" && !guardianRelationship)
        }
        onClick={() => setDone(true)}
        className="bg-belt text-card px-6 py-3 font-display text-lg tracking-wide disabled:opacity-30 mt-8"
      >
        Sign &amp; check in (demo)
      </button>
    </main>
  );
}
