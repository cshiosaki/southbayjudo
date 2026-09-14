"use client";

import { useState } from "react";
import SignaturePad from "@/components/SignaturePad";

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
  const [isMinor, setIsMinor] = useState<"yes" | "no" | "">("");
  const [guardianRelationship, setGuardianRelationship] = useState("");
  const [signedByName, setSignedByName] = useState("");
  const [signatureDataUrl, setSignatureDataUrl] = useState("");
  const [done, setDone] = useState(false);

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
        For students dropping in from another dojo — no session sign-up needed, just a quick waiver.
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
        <select onChange={(e) => setForm({ ...form, membershipOrg: e.target.value })} defaultValue="USJF">
          <option value="">No current membership</option>
          <option value="USJF">USJF</option>
          <option value="USA_JUDO">USA Judo</option>
          <option value="OTHER">Other</option>
        </select>
        <input placeholder="Membership ID (if any)" onChange={(e) => setForm({ ...form, membershipId: e.target.value })} />
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
      {isMinor === "yes" && (
        <p className="text-xs text-ink/50 mb-2">
          As the parent/guardian, you're signing on behalf of {form.firstName || "the student"}.
        </p>
      )}
      <p className="text-xs text-ink/50 mb-4">
        Date: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
      </p>
      <p className="text-sm text-ink/60 mb-2">Sign below</p>
      <SignaturePad onChange={setSignatureDataUrl} />

      <button
        disabled={
          !form.firstName ||
          !form.lastName ||
          !form.homeDojo ||
          !form.hasMedicalConditions ||
          (form.hasMedicalConditions === "yes" && !form.medicalNotes.trim()) ||
          !signedByName ||
          !signatureDataUrl ||
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
