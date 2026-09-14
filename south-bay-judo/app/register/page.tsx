"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import type { SessionConfig, ClassTimeConfig } from "@/lib/sessions";
import {
  GI_SIZES,
  DUMMY_SIZES,
  DUFFLE_SIZES,
  TSHIRT_SIZES,
  SWEATSHIRT_SIZES,
  MEMBERSHIP_FEE,
  SHORT_TERM_MEMBERSHIP_FEE,
} from "@/lib/sessions";

/**
 * TEST MODE — Stripe Checkout uses sandbox credentials until launch.
 *
 * PRICING (per the club's real fee schedule):
 * - Regular sessions charge per family, tiered by how many kids from the
 *   same family are in that session (1st/2nd/3rd+ — see sessionFeeFor).
 * - A returning student joining late / transferring / coming back after a
 *   break is prorated at $10/class instead, capped at the 1st-student price.
 * - USJF is the required federation; $70/yr individually, with a cheaper
 *   family plan once 3+ household members need membership.
 * - Gi is a per-student optional add-on; practice dummies and duffle bags
 *   are family-level add-ons picked once at the end.
 *
 * Session dates/prices/class times are fetched from /api/site-config at
 * load time — see lib/sessions.ts for fallback defaults and
 * lib/config-store.ts for how the live values are read.
 */

const MEDICAL_ACK_TEXT = `I acknowledge that judo involves physical contact and carries inherent risk of injury. I certify that the participant named above is physically fit to participate, and I will disclose any medical conditions, allergies, or physical limitations to South Bay Judo instructors. I release South Bay Judo, the City of Torrance, and their instructors and volunteers from liability for injuries sustained during normal participation, except in cases of gross negligence. I consent to emergency medical treatment for the participant when necessary.`;

type MembershipStatus = "none" | "current";

function isExpired(dateStr: string): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return false;
  return d.getTime() < Date.now();
}

function needsUsjfMembership(student: StudentEntry): boolean {
  return (
    student.membershipOrg !== "USJF" ||
    student.membershipStatus !== "current" ||
    !student.memberIdNumber ||
    !student.membershipExpires ||
    isExpired(student.membershipExpires)
  );
}

/** Loose check that a picked USJF record's name plausibly matches the student being registered — catches picking a parent's or sibling's record by mistake. Sheet names are "Last, First Middle", so this isn't exact, just a sanity check. */
function namesLikelyMatch(sheetName: string, firstName: string, lastName: string): boolean {
  if (!firstName || !lastName || !sheetName) return true;
  const lower = sheetName.toLowerCase();
  return lower.includes(firstName.toLowerCase().trim()) && lower.includes(lastName.toLowerCase().trim());
}

interface StudentEntry {
  id: string;
  sessionId: string;
  classTimeId: string;
  isNewStudent: boolean;
  isLateOrTransfer: boolean;
  classesRemaining: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  beltRank: string;
  emergencyContact: string;
  emergencyPhone: string;
  medicalNotes: string;
  hasMedicalConditions: "no" | "yes" | "";
  membershipStatus: MembershipStatus;
  membershipOrg: string;
  memberIdNumber: string;
  membershipExpires: string;
  membershipMismatchConfirmed: boolean;
  giSizeId: string;
  photoConsent: "yes" | "no" | "";
  signedByName: string;
  autoRenew: boolean;
}

function blankStudent(): StudentEntry {
  return {
    id: crypto.randomUUID(),
    sessionId: "",
    classTimeId: "",
    isNewStudent: true,
    isLateOrTransfer: false,
    classesRemaining: "",
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    beltRank: "",
    emergencyContact: "",
    emergencyPhone: "",
    medicalNotes: "",
    hasMedicalConditions: "",
    membershipStatus: "none",
    membershipOrg: "USJF",
    memberIdNumber: "",
    membershipExpires: "",
    membershipMismatchConfirmed: false,
    giSizeId: "",
    photoConsent: "",
    signedByName: "",
    autoRenew: false,
  };
}

type Step = "guardian" | "session" | "info" | "membership" | "waiver" | "review";
const STUDENT_STEPS: Step[] = ["session", "info", "membership", "waiver"];

const orgLabel: Record<string, string> = {
  USJF: "USJF",
  USA_JUDO: "USA Judo",
};

/** Family position within a session — 1st, 2nd, 3rd+ child registering for that same session. */
function familyPositions(students: StudentEntry[]): Record<string, number> {
  const counters: Record<string, number> = {};
  const map: Record<string, number> = {};
  for (const s of students) {
    counters[s.sessionId] = (counters[s.sessionId] || 0) + 1;
    map[s.id] = counters[s.sessionId];
  }
  return map;
}

function sessionFeeFor(s: StudentEntry, session: SessionConfig | undefined, position: number): number {
  if (!session) return 0;
  if (session.pricingMode === "flat") return session.flatPrice ?? 0;

  const tierPrice =
    position === 1 ? session.familyTierFirst ?? 0 : position === 2 ? session.familyTierSecond ?? 0 : session.familyTierThirdPlus ?? 0;

  if (!s.isNewStudent && s.isLateOrTransfer) {
    const classes = Number(s.classesRemaining) || 0;
    return Math.min(tierPrice, 10 * classes);
  }
  return tierPrice;
}

export default function RegisterPage() {
  const [step, setStep] = useState<Step>("guardian");
  const [guardian, setGuardian] = useState({ firstName: "", lastName: "", email: "", phone: "", emailOptIn: true });
  const [guardian2, setGuardian2] = useState({ firstName: "", lastName: "", email: "", phone: "" });
  const [students, setStudents] = useState<StudentEntry[]>([]);
  const [draft, setDraft] = useState<StudentEntry>(blankStudent());

  const [sessions, setSessions] = useState<SessionConfig[]>([]);
  const [classTimes, setClassTimes] = useState<ClassTimeConfig[]>([]);
  const [configLoading, setConfigLoading] = useState(true);

  const [dummyOrders, setDummyOrders] = useState<string[]>([]); // sizeIds, one per unit ordered
  const [duffleOrders, setDuffleOrders] = useState<string[]>([]);
  const [tshirtOrders, setTshirtOrders] = useState<string[]>([]);
  const [sweatshirtOrders, setSweatshirtOrders] = useState<string[]>([]);

  const [usjfQuery, setUsjfQuery] = useState("");
  const [usjfResults, setUsjfResults] = useState<{ name: string; expires: string; id: string }[]>([]);
  const [usjfSearching, setUsjfSearching] = useState(false);
  const [usjfManualEntry, setUsjfManualEntry] = useState(false);
  const [needsMembershipSelected, setNeedsMembershipSelected] = useState(false);

  useEffect(() => {
    if (usjfQuery.trim().length < 2) {
      setUsjfResults([]);
      return;
    }
    setUsjfSearching(true);
    const handle = setTimeout(() => {
      fetch(`/api/usjf-lookup?q=${encodeURIComponent(usjfQuery)}`)
        .then((r) => r.json())
        .then((data) => setUsjfResults(data.results || []))
        .finally(() => setUsjfSearching(false));
    }, 300);
    return () => clearTimeout(handle);
  }, [usjfQuery]);

  useEffect(() => {
    fetch("/api/site-config")
      .then((r) => r.json())
      .then((config) => {
        setSessions(config.sessions);
        setClassTimes(config.classTimes);
      })
      .finally(() => setConfigLoading(false));
  }, []);

  const draftSession = sessions.find((s) => s.id === draft.sessionId);
  const draftMembershipMismatch =
    draft.membershipStatus === "current" &&
    !!usjfQuery &&
    !usjfManualEntry &&
    !namesLikelyMatch(usjfQuery, draft.firstName, draft.lastName) &&
    !draft.membershipMismatchConfirmed;
  const draftClassTime = classTimes.find((c) => c.id === draft.classTimeId);
  const stepIndex = STUDENT_STEPS.indexOf(step);

  const positions = familyPositions(students);
  const sessionFeeTotal = students.reduce((sum, s) => sum + sessionFeeFor(s, sessions.find((x) => x.id === s.sessionId), positions[s.id]), 0);
  const giTotal = students.reduce((sum, s) => sum + (GI_SIZES.find((g) => g.id === s.giSizeId)?.price ?? 0), 0);

  const noMembershipCount = students.filter(needsUsjfMembership).length;

  const gearTotal =
    dummyOrders.reduce((sum, id) => sum + (DUMMY_SIZES.find((d) => d.id === id)?.price ?? 0), 0) +
    duffleOrders.reduce((sum, id) => sum + (DUFFLE_SIZES.find((d) => d.id === id)?.price ?? 0), 0) +
    tshirtOrders.reduce((sum, id) => sum + (TSHIRT_SIZES.find((d) => d.id === id)?.price ?? 0), 0) +
    sweatshirtOrders.reduce((sum, id) => sum + (SWEATSHIRT_SIZES.find((d) => d.id === id)?.price ?? 0), 0);

  const total = sessionFeeTotal + giTotal + gearTotal;

  function finishStudent() {
    setStudents([...students, draft]);
    setDraft(blankStudent());
    setUsjfQuery("");
    setUsjfResults([]);
    setUsjfManualEntry(false);
    setNeedsMembershipSelected(false);
  }

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  async function submitRegistration() {
    setSubmitting(true);
    setSubmitError("");
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guardian,
          guardian2: (guardian2.firstName || guardian2.lastName) ? guardian2 : null,
          students: students.map((s) => {
            const session = sessions.find((x) => x.id === s.sessionId);
            return {
              sessionId: s.sessionId,
              sessionLabel: session?.label ?? "",
              classTimeId: s.classTimeId,
              classTimeLabel: classTimes.find((x) => x.id === s.classTimeId)?.label ?? "",
              isNewStudent: s.isNewStudent,
              isLateOrTransfer: s.isLateOrTransfer,
              classesRemaining: s.classesRemaining,
              firstName: s.firstName,
              lastName: s.lastName,
              dateOfBirth: s.dateOfBirth,
              beltRank: s.beltRank,
              emergencyContact: s.emergencyContact,
              emergencyPhone: s.emergencyPhone,
              hasMedicalConditions: s.hasMedicalConditions,
              medicalNotes: s.medicalNotes,
              membershipStatus: s.membershipStatus,
              membershipOrg: s.membershipOrg,
              memberIdNumber: s.memberIdNumber,
              membershipExpires: s.membershipExpires,
              giSizeId: s.giSizeId,
              photoConsent: s.photoConsent,
              signedByName: s.signedByName,
              autoRenew: s.autoRenew,
            };
          }),
          familyExtras: {
            dummyOrderIds: dummyOrders,
            duffleOrderIds: duffleOrders,
            tshirtOrderIds: tshirtOrders,
            sweatshirtOrderIds: sweatshirtOrders,
          },
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Checkout could not be created.");
      } else {
        const data = await res.json();
        if (!data.checkoutUrl) throw new Error("Stripe did not return a checkout link.");
        window.location.assign(data.checkoutUrl);
      }
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Checkout could not be created.");
      setSubmitting(false);
    }
  }

  if (configLoading) {
    return <main className="max-w-2xl mx-auto px-6 py-24 text-center text-ink/50">Loading current sessions…</main>;
  }

  if (step === "guardian") {
    return (
      <main className="max-w-2xl mx-auto px-6 py-16">
        <h1 className="font-display text-5xl mb-2">Session Registration</h1>
        <p className="text-ink/60 mb-10">
          Enter the primary contact below. If you are an adult registering yourself, use your own information.
        </p>
        <fieldset>
          <legend className="font-display text-lg mb-1">Primary contact or adult registrant</legend>
          <p className="mb-3 text-sm text-ink/60">This person will receive registration confirmations and receipts.</p>
          <input placeholder="First name" value={guardian.firstName} onChange={(e) => setGuardian({ ...guardian, firstName: e.target.value })} />
          <input placeholder="Last name" value={guardian.lastName} onChange={(e) => setGuardian({ ...guardian, lastName: e.target.value })} />
          <input placeholder="Email" type="email" value={guardian.email} onChange={(e) => setGuardian({ ...guardian, email: e.target.value })} />
          <label className="flex items-start gap-3 border border-ink/15 bg-card p-3 text-sm leading-relaxed">
            <input
              type="checkbox"
              checked={guardian.emailOptIn}
              onChange={(e) => setGuardian({ ...guardian, emailOptIn: e.target.checked })}
            />
            <span>
              Keep me informed about South Bay Judo news, events, schedule updates, and registration reminders by email.
              <span className="block text-xs text-ink/55">You can unsubscribe at any time.</span>
            </span>
          </label>
          <input placeholder="Phone" value={guardian.phone} onChange={(e) => setGuardian({ ...guardian, phone: e.target.value })} />
        </fieldset>

        <fieldset>
          <legend className="font-display text-lg mb-1">Additional parent or guardian (optional)</legend>
          <p className="mb-3 text-sm text-ink/60">For youth or family registrations only.</p>
          <input placeholder="First name" value={guardian2.firstName} onChange={(e) => setGuardian2({ ...guardian2, firstName: e.target.value })} />
          <input placeholder="Last name" value={guardian2.lastName} onChange={(e) => setGuardian2({ ...guardian2, lastName: e.target.value })} />
          <input placeholder="Email" type="email" value={guardian2.email} onChange={(e) => setGuardian2({ ...guardian2, email: e.target.value })} />
          <input placeholder="Phone" value={guardian2.phone} onChange={(e) => setGuardian2({ ...guardian2, phone: e.target.value })} />
        </fieldset>

        <button
          disabled={!guardian.firstName || !guardian.email}
          onClick={() => setStep("session")}
          className="bg-belt text-card px-6 py-3 font-display text-lg tracking-wide disabled:opacity-30"
        >
          Add first participant
        </button>
      </main>
    );
  }

  if (step === "review") {
    return (
      <main className="max-w-2xl mx-auto px-6 py-16">
        <h1 className="font-display text-5xl mb-2">Review registration</h1>
        <p className="text-ink/60 mb-10">
          {guardian.firstName} {guardian.lastName}
          {(guardian2.firstName || guardian2.lastName) && ` & ${guardian2.firstName} ${guardian2.lastName}`} —{" "}
          {students.length} participant{students.length !== 1 ? "s" : ""}
        </p>

        <div className="space-y-6 mb-8">
          {students.map((s) => {
            const session = sessions.find((x) => x.id === s.sessionId);
            const classTime = classTimes.find((x) => x.id === s.classTimeId);
            const fee = sessionFeeFor(s, session, positions[s.id]);
            const giPrice = GI_SIZES.find((g) => g.id === s.giSizeId)?.price ?? 0;
            const needsUsjf = needsUsjfMembership(s);
            const sessionIndex = sessions.findIndex((item) => item.id === s.sessionId);
            const nextRegularSession = sessions
              .slice(sessionIndex + 1)
              .find((item) => item.pricingMode === "family_tier");
            const renewalSession = nextRegularSession?.label || "next year's Winter session";
            return (
              <div key={s.id} className="bg-card border border-ink/15">
                <div className="p-4 bg-ink text-canvas flex justify-between items-center">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-display text-lg">{s.firstName} {s.lastName}</span>
                    {needsUsjf && (
                      <span className="rounded-sm bg-belt px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">
                        USJF membership needed
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => setStudents(students.filter((x) => x.id !== s.id))}
                    className="text-xs underline text-canvas/70"
                  >
                    Remove
                  </button>
                </div>
                <div className="divide-y divide-ink/10 text-sm">
                  <div className="p-3 flex justify-between"><span>Session</span><span>{session?.label}</span></div>
                  <div className="p-3 flex justify-between"><span>Class time</span><span>{classTime?.label} ({classTime?.age})</span></div>
                  <div className="p-3 flex justify-between">
                    <span>Student status</span>
                    <span className="font-semibold text-belt">{s.isNewStudent ? "NEW" : "RET"}</span>
                  </div>
                  <div className="p-3 flex justify-between">
                    <span>
                      Session fee
                      {session?.pricingMode === "family_tier" && !(!s.isNewStudent && s.isLateOrTransfer) && (
                        <span className="text-ink/50"> (family position #{positions[s.id]})</span>
                      )}
                      {!s.isNewStudent && s.isLateOrTransfer && <span className="text-ink/50"> (prorated)</span>}
                    </span>
                    <span>${fee}</span>
                  </div>
                  {s.giSizeId && (
                    <div className="p-3 flex justify-between"><span>Gi ({GI_SIZES.find((g) => g.id === s.giSizeId)?.label})</span><span>${giPrice}</span></div>
                  )}
                  {needsUsjf && (
                    <div className="p-3 text-xs text-belt">No current USJF membership confirmed — must register or renew directly at usjf.org</div>
                  )}
                  <label className={`m-3 flex cursor-pointer items-start gap-3 border p-4 transition-colors ${s.autoRenew ? "border-belt bg-belt/5" : "border-ink/15 bg-canvas/40"}`}>
                    <input
                      type="checkbox"
                      checked={s.autoRenew}
                      onChange={(event) =>
                        setStudents(students.map((student) =>
                          student.id === s.id ? { ...student, autoRenew: event.target.checked } : student
                        ))
                      }
                    />
                    <span>
                      <strong className="block font-display text-lg leading-tight">
                        Auto-renew {s.firstName}
                      </strong>
                      <span className="mt-1 block text-xs leading-relaxed text-ink/65">
                        Enroll in {renewalSession || "the next session"}. We’ll email before the renewal charge to confirm the class time, waiver, and current price.
                      </span>
                    </span>
                  </label>
                </div>
              </div>
            );
          })}
        </div>

        <button
          onClick={() => setStep("session")}
          className="border border-ink/30 px-5 py-2.5 font-display text-base tracking-wide mb-10"
        >
          + Add another participant
        </button>

        {noMembershipCount > 0 && (
          <div className="bg-card border border-belt/40 p-4 mb-6">
            <p className="font-display text-lg mb-2 text-belt">Membership needed</p>
            <p className="text-sm text-ink/70">
              {noMembershipCount} participant{noMembershipCount !== 1 ? "s don't" : " doesn't"} have a current USJF
              membership on file. USJF membership is required before their first class and must be
              purchased directly through <span className="underline">usjf.org</span>. Primary annual
              membership is ${MEMBERSHIP_FEE}; a ${SHORT_TERM_MEMBERSHIP_FEE} monthly option is available
              for participants who currently hold USA Judo membership.
            </p>
          </div>
        )}

        <div className="bg-card border border-ink/15 p-4 mb-8">
          <p className="font-display text-lg mb-3">Gear (optional)</p>
          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-xs text-ink/60 mb-1">Add a practice dummy</p>
              <div className="flex gap-2">
                <select id="dummy-select" className="flex-1">
                  {DUMMY_SIZES.map((d) => (
                    <option key={d.id} value={d.id}>{d.label} — ${d.price}</option>
                  ))}
                </select>
                <button
                  className="border border-ink/30 px-3 text-sm"
                  onClick={() => {
                    const el = document.getElementById("dummy-select") as HTMLSelectElement;
                    setDummyOrders([...dummyOrders, el.value]);
                  }}
                >
                  Add
                </button>
              </div>
            </div>
            <div>
              <p className="text-xs text-ink/60 mb-1">Add a duffle bag</p>
              <div className="flex gap-2">
                <select id="duffle-select" className="flex-1">
                  {DUFFLE_SIZES.map((d) => (
                    <option key={d.id} value={d.id}>{d.label} — ${d.price}</option>
                  ))}
                </select>
                <button
                  className="border border-ink/30 px-3 text-sm"
                  onClick={() => {
                    const el = document.getElementById("duffle-select") as HTMLSelectElement;
                    setDuffleOrders([...duffleOrders, el.value]);
                  }}
                >
                  Add
                </button>
              </div>
            </div>
            <div>
              <p className="text-xs text-ink/60 mb-1">Add a t-shirt</p>
              <div className="flex gap-2">
                <select id="tshirt-select" className="flex-1">
                  {TSHIRT_SIZES.map((d) => (
                    <option key={d.id} value={d.id}>{d.label} — ${d.price}</option>
                  ))}
                </select>
                <button
                  className="border border-ink/30 px-3 text-sm"
                  onClick={() => {
                    const el = document.getElementById("tshirt-select") as HTMLSelectElement;
                    setTshirtOrders([...tshirtOrders, el.value]);
                  }}
                >
                  Add
                </button>
              </div>
            </div>
            <div>
              <p className="text-xs text-ink/60 mb-1">Add a sweatshirt</p>
              <div className="flex gap-2">
                <select id="sweatshirt-select" className="flex-1">
                  {SWEATSHIRT_SIZES.map((d) => (
                    <option key={d.id} value={d.id}>{d.label} — ${d.price}</option>
                  ))}
                </select>
                <button
                  className="border border-ink/30 px-3 text-sm"
                  onClick={() => {
                    const el = document.getElementById("sweatshirt-select") as HTMLSelectElement;
                    setSweatshirtOrders([...sweatshirtOrders, el.value]);
                  }}
                >
                  Add
                </button>
              </div>
            </div>
          </div>
          {(dummyOrders.length > 0 || duffleOrders.length > 0 || tshirtOrders.length > 0 || sweatshirtOrders.length > 0) && (
            <ul className="text-sm space-y-1">
              {dummyOrders.map((id, i) => (
                <li key={`d${i}`} className="flex justify-between">
                  <span>Practice Dummy — {DUMMY_SIZES.find((d) => d.id === id)?.label}</span>
                  <span className="flex items-center gap-2">
                    ${DUMMY_SIZES.find((d) => d.id === id)?.price}
                    <button onClick={() => setDummyOrders(dummyOrders.filter((_, idx) => idx !== i))} className="text-belt underline text-xs">remove</button>
                  </span>
                </li>
              ))}
              {duffleOrders.map((id, i) => (
                <li key={`b${i}`} className="flex justify-between">
                  <span>Duffle Bag — {DUFFLE_SIZES.find((d) => d.id === id)?.label}</span>
                  <span className="flex items-center gap-2">
                    ${DUFFLE_SIZES.find((d) => d.id === id)?.price}
                    <button onClick={() => setDuffleOrders(duffleOrders.filter((_, idx) => idx !== i))} className="text-belt underline text-xs">remove</button>
                  </span>
                </li>
              ))}
              {tshirtOrders.map((id, i) => (
                <li key={`t${i}`} className="flex justify-between">
                  <span>T-Shirt — {TSHIRT_SIZES.find((d) => d.id === id)?.label}</span>
                  <span className="flex items-center gap-2">
                    ${TSHIRT_SIZES.find((d) => d.id === id)?.price}
                    <button onClick={() => setTshirtOrders(tshirtOrders.filter((_, idx) => idx !== i))} className="text-belt underline text-xs">remove</button>
                  </span>
                </li>
              ))}
              {sweatshirtOrders.map((id, i) => (
                <li key={`w${i}`} className="flex justify-between">
                  <span>Sweatshirt — {SWEATSHIRT_SIZES.find((d) => d.id === id)?.label}</span>
                  <span className="flex items-center gap-2">
                    ${SWEATSHIRT_SIZES.find((d) => d.id === id)?.price}
                    <button onClick={() => setSweatshirtOrders(sweatshirtOrders.filter((_, idx) => idx !== i))} className="text-belt underline text-xs">remove</button>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-ink text-canvas p-5 flex justify-between items-center mb-8">
          <span className="font-display text-xl">Total</span>
          <span className="font-display text-3xl text-gold">${total}</span>
        </div>

        <button
          disabled={students.length === 0 || submitting}
          onClick={submitRegistration}
          className="bg-belt text-card px-6 py-3 font-display text-lg tracking-wide disabled:opacity-30"
        >
          {submitting ? "Opening secure checkout..." : "Continue to secure payment"}
        </button>
        <p className="mt-3 text-xs leading-relaxed text-ink/55">
          Stripe Checkout supports credit cards, bank payments, Apple Pay, and Google Pay when available on your device.
        </p>
        {submitError && <p className="text-belt text-sm mt-4">{submitError}</p>}
      </main>
    );
  }

  // ---- Per-participant steps: session / info / membership / waiver ----
  return (
    <main className="max-w-2xl mx-auto px-6 py-16">
      <h1 className="font-display text-5xl mb-2">
        {students.length === 0 ? "First participant" : `Participant ${students.length + 1}`}
      </h1>
      <p className="text-ink/60 mb-10">Step {stepIndex + 1} of {STUDENT_STEPS.length} for this participant</p>

      {step === "session" && (
        <section>
          <h2 className="font-display text-2xl mb-5">Choose a session &amp; class time</h2>
          <p className="text-xs text-ink/60 mb-5">Each participant can be in a different session or class time — pick what fits their age group.</p>

          <div className="flex gap-6 mb-2">
            <label className="flex items-center gap-2 text-sm">
              <input type="radio" checked={draft.isNewStudent} onChange={() => setDraft({ ...draft, isNewStudent: true, isLateOrTransfer: false })} /> New student
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="radio" checked={!draft.isNewStudent} onChange={() => setDraft({ ...draft, isNewStudent: false })} /> Returning student
            </label>
          </div>

          {!draft.isNewStudent && (
            <div className="mb-6">
              <label className="flex items-start gap-3 cursor-pointer bg-card border border-ink/15 p-3">
                <input
                  type="checkbox"
                  checked={draft.isLateOrTransfer}
                  onChange={(e) => setDraft({ ...draft, isLateOrTransfer: e.target.checked })}
                  className="mt-1"
                />
                <span className="text-sm">
                  <span className="block">Joining after the session started, transferring from another club, or returning after a break?</span>
                  <span className="text-ink/50 text-xs">Prorated at $10/class instead of the standard price.</span>
                </span>
              </label>
              {draft.isLateOrTransfer && (
                <input
                  type="number"
                  placeholder="Classes remaining in this session"
                  value={draft.classesRemaining}
                  onChange={(e) => setDraft({ ...draft, classesRemaining: e.target.value })}
                  className="mt-2 max-w-xs"
                />
              )}
            </div>
          )}

          <div className="space-y-px bg-ink/10 mb-8">
            {sessions.map((s) => (
              <label
                key={s.id}
                className={`flex items-center justify-between gap-4 bg-card p-4 cursor-pointer ${
                  s.registrationOpen === false || (!s.allowNew && draft.isNewStudent)
                    ? "opacity-40 cursor-not-allowed"
                    : ""
                }`}
              >
                <span className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="session"
                    checked={draft.sessionId === s.id}
                    onChange={() => setDraft({ ...draft, sessionId: s.id })}
                    disabled={s.registrationOpen === false || (!s.allowNew && draft.isNewStudent)}
                  />
                  <span>
                    <span className="font-display text-lg block leading-tight">{s.label}</span>
                    <span className="text-xs text-ink/60">
                      {s.dates}
                      {s.registrationOpen === false
                        ? " · registration not open"
                        : !s.allowNew
                          ? " · returning students only"
                          : ""}
                    </span>
                  </span>
                </span>
                <span className="font-display text-lg text-belt">
                  {s.registrationOpen === false
                    ? "Not open yet"
                    : s.pricingMode === "flat"
                      ? `$${s.flatPrice}`
                      : `$${s.familyTierFirst}+`}
                </span>
              </label>
            ))}
          </div>

          <h3 className="font-display text-xl mb-4">Class time (by age)</h3>
          <div className="space-y-px bg-ink/10 mb-10">
            {classTimes.map((c) => (
              <label key={c.id} className="flex items-center gap-3 bg-card p-4 cursor-pointer">
                <input
                  type="radio"
                  name="classtime"
                  checked={draft.classTimeId === c.id}
                  onChange={() => setDraft({ ...draft, classTimeId: c.id })}
                />
                <span>
                  <span className="font-display text-lg block leading-tight">{c.label} — {c.age}</span>
                  <span className="text-xs text-ink/60">{c.time}</span>
                </span>
              </label>
            ))}
          </div>

          <div className="flex gap-4">
            {students.length > 0 && (
              <button onClick={() => setStep("review")} className="text-ink/60 underline font-display text-lg">Back to review</button>
            )}
            <button
              disabled={!draft.sessionId || !draft.classTimeId}
              onClick={() => setStep("info")}
              className="bg-belt text-card px-6 py-3 font-display text-lg tracking-wide disabled:opacity-30"
            >
              Continue
            </button>
          </div>
        </section>
      )}

      {step === "info" && (
        <section>
          <h2 className="font-display text-2xl mb-2">Participant information</h2>
          {students.length === 0 && (
            <button
              type="button"
              onClick={() => setDraft({ ...draft, firstName: guardian.firstName, lastName: guardian.lastName })}
              className="mb-5 text-sm text-belt underline underline-offset-2"
            >
              I’m registering myself — use my name
            </button>
          )}
          <fieldset>
            <input placeholder="First name" value={draft.firstName} onChange={(e) => setDraft({ ...draft, firstName: e.target.value })} />
            <input placeholder="Last name" value={draft.lastName} onChange={(e) => setDraft({ ...draft, lastName: e.target.value })} />
            <label className="block text-sm text-ink/70">
              Participant date of birth
              <input required type="date" value={draft.dateOfBirth} onChange={(e) => setDraft({ ...draft, dateOfBirth: e.target.value })} />
            </label>
            <input placeholder="Current belt rank, if known (optional)" value={draft.beltRank} onChange={(e) => setDraft({ ...draft, beltRank: e.target.value })} />
            <input placeholder="Emergency contact name" value={draft.emergencyContact} onChange={(e) => setDraft({ ...draft, emergencyContact: e.target.value })} />
            <input placeholder="Emergency contact phone" value={draft.emergencyPhone} onChange={(e) => setDraft({ ...draft, emergencyPhone: e.target.value })} />
            {(guardian.firstName || guardian2.firstName) && (
              <div className="flex gap-4 flex-wrap -mt-1">
                {guardian.firstName && (
                  <button
                    type="button"
                    onClick={() =>
                      setDraft({
                        ...draft,
                        emergencyContact: `${guardian.firstName} ${guardian.lastName}`.trim(),
                        emergencyPhone: guardian.phone,
                      })
                    }
                    className="text-xs text-ink/50 underline"
                  >
                    Same as {guardian.firstName}
                  </button>
                )}
                {guardian2.firstName && (
                  <button
                    type="button"
                    onClick={() =>
                      setDraft({
                        ...draft,
                        emergencyContact: `${guardian2.firstName} ${guardian2.lastName}`.trim(),
                        emergencyPhone: guardian2.phone,
                      })
                    }
                    className="text-xs text-ink/50 underline"
                  >
                    Same as {guardian2.firstName}
                  </button>
                )}
              </div>
            )}
          </fieldset>

          <div className="mb-6">
            <p className="text-sm mb-2">Medical conditions, allergies, or physical limitations</p>
            <div className="flex gap-6 mb-3">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  checked={draft.hasMedicalConditions === "no"}
                  onChange={() => setDraft({ ...draft, hasMedicalConditions: "no", medicalNotes: "" })}
                />
                No medical conditions, allergies, or limitations
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  checked={draft.hasMedicalConditions === "yes"}
                  onChange={() => setDraft({ ...draft, hasMedicalConditions: "yes" })}
                />
                Yes — list below
              </label>
            </div>
            {draft.hasMedicalConditions === "yes" && (
              <textarea
                placeholder="What should instructors know about?"
                value={draft.medicalNotes}
                onChange={(e) => setDraft({ ...draft, medicalNotes: e.target.value })}
              />
            )}
          </div>

          <label className="block text-xs text-ink/60 mb-6 max-w-xs">
            Need to order a gi? (optional)
            <select value={draft.giSizeId} onChange={(e) => setDraft({ ...draft, giSizeId: e.target.value })}>
              <option value="">No gi needed</option>
              {GI_SIZES.map((g) => (
                <option key={g.id} value={g.id}>{g.label} — ${g.price}</option>
              ))}
            </select>
            <details className="mt-3 border border-ink/15 bg-card p-3">
              <summary className="cursor-pointer text-sm font-semibold text-belt">View the Hatashita/FUJI judo gi size chart</summary>
              <Image
                src="/images/fuji-judo-gi-size-chart.png"
                alt="FUJI Sports size chart for FUJI judo gi uniforms"
                width={622}
                height={1008}
                className="mt-3 h-auto w-full"
              />
              <a
                href="https://hatashitasports.com/pages/size-charts"
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-block text-xs text-ink/55 underline underline-offset-2"
              >
                Official Hatashita/FUJI size chart
              </a>
            </details>
            <span className="mt-2 block text-xs leading-relaxed text-ink/60">
              If the gi does not fit, it may be exchanged. You will only pay the difference if the replacement costs more.
            </span>
          </label>

          <div className="mb-6">
            <p className="text-sm mb-2">Photo/video consent</p>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 text-sm">
                <input type="radio" checked={draft.photoConsent === "yes"} onChange={() => setDraft({ ...draft, photoConsent: "yes" })} />
                Yes, okay to use in club photos/videos
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="radio" checked={draft.photoConsent === "no"} onChange={() => setDraft({ ...draft, photoConsent: "no" })} />
                No
              </label>
            </div>
          </div>

          <div className="flex gap-4">
            <button onClick={() => setStep("session")} className="text-ink/60 underline font-display text-lg">Back</button>
            <button
              disabled={!draft.firstName || !draft.lastName || !draft.dateOfBirth || !draft.hasMedicalConditions}
              onClick={() => setStep("membership")}
              className="bg-belt text-card px-6 py-3 font-display text-lg tracking-wide disabled:opacity-30"
            >
              Continue
            </button>
          </div>
        </section>
      )}

      {step === "membership" && (
        <section>
          <h2 className="font-display text-2xl mb-3">USJF or USA Judo membership</h2>
          <p className="text-sm text-ink/70 mb-5">
            All participants must carry a current USJF membership for insurance coverage. A primary
            12-month USJF membership is ${MEMBERSHIP_FEE}. If the participant currently has USA Judo,
            they must also obtain a USJF short-term membership (${SHORT_TERM_MEMBERSHIP_FEE} monthly).
            Memberships are purchased directly through{" "}
            <a href="https://www.usjf.com/membership-program/" target="_blank" rel="noreferrer" className="underline">usjf.org</a>.
          </p>

          {draft.isNewStudent && (
            <div className="mb-5 border border-belt/35 bg-belt/5 p-3 text-sm text-ink/75">
              <strong>First time in judo?</strong> If this participant does not already have USJF membership,
              purchase the ${MEMBERSHIP_FEE} annual membership before the first class.
            </div>
          )}

          <div className={`mb-6 border p-4 ${needsMembershipSelected ? "border-belt bg-belt/10" : "border-ink/20 bg-card"}`}>
            <button
              type="button"
              onClick={() => {
                setNeedsMembershipSelected(true);
                setUsjfManualEntry(false);
                setUsjfQuery("");
                setUsjfResults([]);
                setDraft({
                  ...draft,
                  membershipStatus: "none",
                  membershipOrg: "USJF",
                  memberIdNumber: "",
                  membershipExpires: "",
                  membershipMismatchConfirmed: false,
                });
              }}
              className="w-full text-left"
            >
              <strong className="font-display block text-xl">I don’t have a USJF membership yet</strong>
              <span className="block text-sm text-ink/65 mt-1">
                Select this to let South Bay Judo know the participant still needs to obtain membership.
              </span>
            </button>
            {needsMembershipSelected && (
              <div className="mt-4 border-t border-belt/25 pt-4 text-sm">
                <p className="mb-3">
                  Selecting this option does not enroll the participant. You must visit the official USJF website and complete the membership signup there before the first class.
                </p>
                <a
                  href="https://www.usjf.com/membership-program/"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block bg-belt px-4 py-2 font-display text-card"
                >
                  Go to USJF website to sign up — ${MEMBERSHIP_FEE}
                </a>
              </div>
            )}
          </div>

          {!usjfManualEntry && (
            <div className="mb-6">
              <p className="text-sm mb-1">Search your USJF membership</p>
              <p className="mb-2 text-xs text-ink/60">Enter the last name first. If several names appear, select the correct participant.</p>
              <input
                placeholder="Last name, First name"
                value={usjfQuery}
                onChange={(e) => {
                  setNeedsMembershipSelected(false);
                  setUsjfQuery(e.target.value);
                  setDraft({ ...draft, membershipStatus: "none", memberIdNumber: "", membershipExpires: "", membershipMismatchConfirmed: false });
                }}
              />
              {usjfSearching && <p className="text-xs text-ink/50 mt-2">Searching…</p>}
              {!usjfSearching && usjfResults.length > 0 && (
                <div className="mt-2 space-y-px bg-ink/10">
                  {usjfResults.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        setNeedsMembershipSelected(false);
                        setDraft({
                          ...draft,
                          membershipStatus: "current",
                          membershipOrg: "USJF",
                          memberIdNumber: m.id,
                          membershipExpires: m.expires,
                          membershipMismatchConfirmed: false,
                        });
                        setUsjfQuery(m.name);
                        setUsjfResults([]);
                      }}
                      className="w-full text-left bg-card p-3 text-sm hover:bg-mat/15"
                    >
                      <span className="font-display block">{m.name}</span>
                      <span className="text-xs text-ink/60">
                        USJF #{m.id} · {isExpired(m.expires) ? "expired" : "expires"} {m.expires}
                      </span>
                    </button>
                  ))}
                </div>
              )}
              <button
                type="button"
                onClick={() => {
                  setNeedsMembershipSelected(false);
                  setUsjfManualEntry(true);
                }}
                className="text-xs text-ink/50 underline mt-3"
              >
                Can't find your name? Enter it manually, or add a USA Judo membership instead
              </button>
            </div>
          )}

          {usjfManualEntry && (
            <fieldset className="mb-4">
              <select value={draft.membershipOrg} onChange={(e) => setDraft({ ...draft, membershipOrg: e.target.value })}>
                {Object.entries(orgLabel).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
              <input placeholder="Member ID #" value={draft.memberIdNumber} onChange={(e) => setDraft({ ...draft, membershipStatus: "current", memberIdNumber: e.target.value })} />
              <label className="block text-sm text-ink/70">
                Membership expiration date
                <input
                  type="date"
                  value={draft.membershipExpires}
                  onChange={(e) => setDraft({ ...draft, membershipExpires: e.target.value })}
                />
              </label>
              <p className="text-xs text-ink/60">We'll ask for a photo of the card after this step for admin verification.</p>
              {draft.membershipOrg === "USA_JUDO" && (
                <p className="border border-belt/35 bg-belt/5 p-3 text-sm text-belt">
                  USA Judo membership alone does not meet the club requirement. Purchase a USJF short-term membership
                  (${SHORT_TERM_MEMBERSHIP_FEE} monthly) before the first class.
                </p>
              )}
              <button type="button" onClick={() => setUsjfManualEntry(false)} className="text-xs text-ink/50 underline">
                Back to search
              </button>
            </fieldset>
          )}

          {draft.membershipStatus === "current" && draft.membershipExpires && (
            isExpired(draft.membershipExpires) ? (
              <div className="bg-belt/10 border border-belt p-3 mb-6 text-sm text-belt">
                This membership expired on {draft.membershipExpires} — {draft.firstName || "the participant"} will
                need to renew directly at usjf.org before their first class.
              </div>
            ) : (
              <div className="bg-mat/15 p-3 mb-6 text-sm text-mat">
                Membership is current through {draft.membershipExpires}.
              </div>
            )
          )}

          {draft.membershipStatus === "current" &&
            usjfQuery &&
            !usjfManualEntry &&
            !namesLikelyMatch(usjfQuery, draft.firstName, draft.lastName) && (
              <div className="bg-belt/10 border border-belt p-3 mb-6 text-sm">
                <p className="text-belt mb-2">
                  This membership is registered to <strong>{usjfQuery}</strong> — but you're registering{" "}
                  <strong>{draft.firstName} {draft.lastName}</strong>. A parent's or sibling's record can
                  look similar in search.
                </p>
                <label className="flex items-center gap-2 cursor-pointer text-belt">
                  <input
                    type="checkbox"
                    checked={draft.membershipMismatchConfirmed}
                    onChange={(e) => setDraft({ ...draft, membershipMismatchConfirmed: e.target.checked })}
                  />
                  Yes, this is the correct membership for {draft.firstName || "this participant"}
                </label>
              </div>
            )}

          {draft.membershipStatus === "none" && !usjfManualEntry && usjfQuery.length >= 2 && usjfResults.length === 0 && !usjfSearching && (
            <p className="text-xs text-belt mb-6">
              No match found. They can enter their number manually, or if they don't have a
              membership yet, they'll need to register directly at usjf.org before their first
              class.
            </p>
          )}

          <div className="flex gap-4">
            <button onClick={() => setStep("info")} className="text-ink/60 underline font-display text-lg">Back</button>
            <button
              disabled={draftMembershipMismatch}
              onClick={() => setStep("waiver")}
              className="bg-belt text-card px-6 py-3 font-display text-lg tracking-wide disabled:opacity-30"
            >
              Continue
            </button>
          </div>
        </section>
      )}

      {step === "waiver" && (
        <section>
          <h2 className="font-display text-2xl mb-5">Waiver &amp; medical disclaimer</h2>
          <div className="bg-card border border-ink/15 p-4 text-sm leading-relaxed max-h-40 overflow-auto mb-5">
            {MEDICAL_ACK_TEXT}
          </div>
          <p className="mb-4 text-sm leading-relaxed text-ink/70">
            The parent/guardian, or the adult participant registering themself, is signing for the entire registration submitted here.
          </p>
          <input
            placeholder="Type your full legal name to sign"
            value={draft.signedByName}
            onChange={(e) => setDraft({ ...draft, signedByName: e.target.value })}
            className="mb-2"
          />
          <div className="mb-3 min-h-24 border border-ink/25 bg-card px-5 py-4">
            <p className={`font-signature text-4xl leading-tight ${draft.signedByName ? "text-ink" : "text-ink/30"}`}>
              {draft.signedByName || "Your signature appears here"}
            </p>
            <div className="mt-2 border-t border-ink/35 pt-1 text-xs text-ink/50">Electronic signature</div>
          </div>
          <p className="mb-3 text-xs text-ink/60">
            By typing your full legal name, you agree that it serves as your electronic signature on this waiver and registration.
          </p>
          <p className="text-xs text-ink/50 mb-4">
            Date: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
          </p>

          <div className="flex gap-4 mt-8">
            <button onClick={() => setStep("membership")} className="text-ink/60 underline font-display text-lg">Back</button>
            <button
              disabled={!draft.signedByName.trim() || !draft.photoConsent}
              onClick={() => { finishStudent(); setStep("review"); }}
              className="bg-belt text-card px-6 py-3 font-display text-lg tracking-wide disabled:opacity-30"
            >
              Save participant &amp; review
            </button>
          </div>
        </section>
      )}
    </main>
  );
}
