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
        <input placeholder="Home dojo (optional)" onChange={(e) => setForm({ ...form, homeDojo: e.target.value })} />
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
        <p className="text-sm mb-2">Is {form.firstName || "the visiting student"} under 18?</p>
        <div className="flex gap-6 mb-3">
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" checked={isMinor === "no"} onChange={() => setIsMinor("no")} />
            No — they'll sign for themselves
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" checked={isMinor === "yes"} onChange={() => setIsMinor("yes")} />
            Yes — a parent/guardian is here with them
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
        disabled={!signedByName || !signatureDataUrl || !isMinor || (isMinor === "yes" && !guardianRelationship)}
        onClick={() => setDone(true)}
        className="bg-belt text-card px-6 py-3 font-display text-lg tracking-wide disabled:opacity-30 mt-8"
      >
        Sign &amp; check in (demo)
      </button>
    </main>
  );
}
