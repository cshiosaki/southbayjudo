"use client";

import { useState } from "react";
import { upload } from "@vercel/blob/client";
import type { SessionConfig, ClassTimeConfig } from "@/lib/sessions";
import { GI_SIZES } from "@/lib/sessions";

function isExpired(dateStr: string): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return false;
  return d.getTime() < Date.now();
}

interface RosterRow {
  rowNumber: number;
  timestamp: string;
  sessionId: string;
  sessionLabel: string;
  classTime: string;
  isNewStudent: boolean;
  isLateOrTransfer: boolean;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  beltRank: string;
  guardianFirstName: string;
  guardianLastName: string;
  guardianEmail: string;
  guardianPhone: string;
  guardian2FirstName: string;
  guardian2LastName: string;
  guardian2Email: string;
  guardian2Phone: string;
  emergencyContact: string;
  emergencyPhone: string;
  hasMedicalConditions: string;
  medicalNotes: string;
  membershipStatus: string;
  membershipOrg: string;
  membershipIdNumber: string;
  membershipExpires: string;
  giSize: string;
  photoConsent: string;
  signedByName: string;
  autoRenew: boolean;
  sessionFeeCharged: string;
  paid: boolean;
  familyExtrasNote: string;
}

interface EventDocument {
  title: string;
  url: string;
  downloadUrl?: string;
  pathname: string;
  uploadedAt: string;
}

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [tab, setTab] = useState<"roster" | "events" | "settings">("roster");
  const [eventTitle, setEventTitle] = useState("South Bay Judo Events");
  const [eventFile, setEventFile] = useState<File | null>(null);
  const [eventDocument, setEventDocument] = useState<EventDocument | null>(null);
  const [eventUploading, setEventUploading] = useState(false);
  const [eventProgress, setEventProgress] = useState(0);
  const [eventMessage, setEventMessage] = useState("");

  const [sessions, setSessions] = useState<SessionConfig[]>([]);
  const [classTimes, setClassTimes] = useState<ClassTimeConfig[]>([]);
  const [membershipFee, setMembershipFee] = useState(0);

  const [rosterSessionId, setRosterSessionId] = useState("");
  const [roster, setRoster] = useState<RosterRow[]>([]);
  const [rosterLoading, setRosterLoading] = useState(false);
  const [rosterError, setRosterError] = useState("");

  async function loadRoster(sessionId: string) {
    setRosterSessionId(sessionId);
    setRosterLoading(true);
    setRosterError("");
    try {
      const res = await fetch("/api/admin/roster", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, sessionId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setRosterError(data.error || "Couldn't load roster.");
        setRoster([]);
        return;
      }
      setRoster(data.rows);
    } finally {
      setRosterLoading(false);
    }
  }

  async function togglePaid(row: RosterRow) {
    setRoster(roster.map((r) => (r.rowNumber === row.rowNumber ? { ...r, paid: !r.paid } : r)));
    await fetch("/api/admin/roster/mark-paid", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password, rowNumber: row.rowNumber, paid: !row.paid }),
    });
  }

  const [reminderState, setReminderState] = useState<Record<number, "sending" | "sent" | string>>({});

  async function sendReminder(row: RosterRow) {
    const isExpiredNow = row.membershipStatus === "current" && row.membershipIdNumber && isExpired(row.membershipExpires);
    const reason = isExpiredNow ? "expired" : row.membershipStatus === "current" ? "incomplete" : "missing";
    setReminderState({ ...reminderState, [row.rowNumber]: "sending" });
    const res = await fetch("/api/admin/remind-usjf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        password,
        guardianEmail: row.guardianEmail,
        guardianName: row.guardianFirstName,
        studentName: `${row.firstName} ${row.lastName}`,
        reason,
        expiresDate: row.membershipExpires,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setReminderState({ ...reminderState, [row.rowNumber]: res.ok ? "sent" : data.error || "Failed to send." });
  }

  async function unlock() {
    setLoading(true);
    setError("");
    try {
      const verifyRes = await fetch("/api/admin/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, action: "verify" }),
      });
      if (!verifyRes.ok) {
        const data = await verifyRes.json().catch(() => ({}));
        setError(data.error || "Incorrect password.");
        return;
      }
      const configRes = await fetch("/api/site-config");
      const config = await configRes.json();
      setSessions(config.sessions);
      setClassTimes(config.classTimes);
      setMembershipFee(config.membershipFee);
      const eventsRes = await fetch("/api/events", { cache: "no-store" });
      const eventsData = await eventsRes.json();
      if (eventsData.document) {
        setEventDocument(eventsData.document);
        setEventTitle(eventsData.document.title);
      }
      setUnlocked(true);
      if (config.sessions?.[0]?.id) loadRoster(config.sessions[0].id);
    } finally {
      setLoading(false);
    }
  }

  async function uploadEventPdf() {
    if (!eventFile) return;
    setEventUploading(true);
    setEventProgress(0);
    setEventMessage("");
    try {
      const blob = await upload(`events/${eventFile.name}`, eventFile, {
        access: "public",
        handleUploadUrl: "/api/admin/events/upload",
        clientPayload: JSON.stringify({ password, title: eventTitle }),
        onUploadProgress: ({ percentage }) => setEventProgress(Math.round(percentage)),
      });
      setEventDocument({
        title: eventTitle.trim() || "South Bay Judo Events",
        url: blob.url,
        downloadUrl: blob.downloadUrl,
        pathname: blob.pathname,
        uploadedAt: new Date().toISOString(),
      });
      setEventFile(null);
      setEventMessage("Uploaded — the Events page will update within a few seconds.");
    } catch (uploadError) {
      setEventMessage(uploadError instanceof Error ? uploadError.message : "Upload failed.");
    } finally {
      setEventUploading(false);
    }
  }

  async function save() {
    setLoading(true);
    setError("");
    setSaved(false);
    try {
      const res = await fetch("/api/admin/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password,
          action: "save",
          config: { sessions, classTimes, membershipFee },
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Save failed.");
        return;
      }
      setSaved(true);
    } finally {
      setLoading(false);
    }
  }

  function updateSession(i: number, patch: Partial<SessionConfig>) {
    setSessions(sessions.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  }
  function updateClassTime(i: number, patch: Partial<ClassTimeConfig>) {
    setClassTimes(classTimes.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));
  }

  if (!unlocked) {
    return (
      <main className="max-w-sm mx-auto px-6 py-24">
        <h1 className="font-display text-4xl mb-6">Admin</h1>
        <input
          type="password"
          placeholder="Admin password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && unlock()}
          className="mb-4"
        />
        {error && <p className="text-belt text-sm mb-4">{error}</p>}
        <button
          disabled={!password || loading}
          onClick={unlock}
          className="bg-belt text-card px-6 py-3 font-display text-lg tracking-wide disabled:opacity-30"
        >
          {loading ? "Checking..." : "Unlock"}
        </button>
      </main>
    );
  }

  return (
    <main className="max-w-4xl mx-auto px-6 py-16">
      <h1 className="font-display text-5xl mb-6">Admin</h1>

      <div className="flex gap-2 mb-10 border-b border-ink/15">
        <button
          onClick={() => setTab("roster")}
          className={`font-display text-lg px-4 py-2 -mb-px border-b-2 ${
            tab === "roster" ? "border-belt text-belt" : "border-transparent text-ink/50"
          }`}
        >
          Roster
        </button>
        <button
          onClick={() => setTab("events")}
          className={`font-display text-lg px-4 py-2 -mb-px border-b-2 ${
            tab === "events" ? "border-belt text-belt" : "border-transparent text-ink/50"
          }`}
        >
          Events PDF
        </button>
        <button
          onClick={() => setTab("settings")}
          className={`font-display text-lg px-4 py-2 -mb-px border-b-2 ${
            tab === "settings" ? "border-belt text-belt" : "border-transparent text-ink/50"
          }`}
        >
          Site Settings
        </button>
      </div>

      {tab === "roster" && (
        <section>
          <div className="flex gap-2 flex-wrap mb-6">
            {sessions.map((s) => (
              <button
                key={s.id}
                onClick={() => loadRoster(s.id)}
                className={`text-sm px-3 py-1.5 border ${
                  rosterSessionId === s.id ? "bg-ink text-canvas border-ink" : "border-ink/25 text-ink/70"
                }`}
              >
                {s.label}
              </button>
            ))}
            <button
              onClick={() => loadRoster("")}
              className={`text-sm px-3 py-1.5 border ${
                rosterSessionId === "" ? "bg-ink text-canvas border-ink" : "border-ink/25 text-ink/70"
              }`}
            >
              All sessions
            </button>
          </div>

          {rosterLoading && <p className="text-ink/50 text-sm">Loading…</p>}
          {rosterError && <p className="text-belt text-sm mb-4">{rosterError}</p>}

          {!rosterLoading && !rosterError && roster.length === 0 && (
            <p className="text-ink/50 text-sm">No registrations for this session yet.</p>
          )}

          {!rosterLoading && roster.length > 0 && (() => {
            const expiredCount = roster.filter((r) => r.membershipStatus === "current" && r.membershipIdNumber && isExpired(r.membershipExpires)).length;
            const missingCount = roster.filter((r) => r.membershipStatus !== "current" || !r.membershipIdNumber).length;
            return (expiredCount > 0 || missingCount > 0) ? (
              <div className="bg-belt/10 border border-belt p-4 mb-6">
                <p className="font-display text-lg text-belt mb-1">Insurance alert</p>
                <p className="text-sm text-belt">
                  {expiredCount > 0 && `${expiredCount} membership${expiredCount !== 1 ? "s" : ""} expired`}
                  {expiredCount > 0 && missingCount > 0 && " · "}
                  {missingCount > 0 && `${missingCount} with no membership confirmed`}
                </p>
              </div>
            ) : null;
          })()}

          {!rosterLoading && roster.length > 0 && (
            <div className="space-y-3">
              {roster.map((r) => {
                const hasInsuranceIssue =
                  r.membershipStatus !== "current" ||
                  !r.membershipIdNumber ||
                  (r.membershipExpires && isExpired(r.membershipExpires));
                const giPrice = GI_SIZES.find((gi) => gi.label === r.giSize)?.price;
                return (
                <div key={r.rowNumber} className={`border p-4 ${hasInsuranceIssue ? "bg-belt/10 border-belt/30" : "bg-card border-ink/15"}`}>
                  <div className="flex justify-between items-start gap-4 mb-3">
                    <div>
                      <p className="font-display text-lg leading-tight">
                        {r.firstName} {r.lastName}{" "}
                        <span className="text-xs text-ink/50 font-body">
                          {r.isNewStudent ? "· new" : r.isLateOrTransfer ? "· returning, late/transfer" : "· returning"}
                          {r.beltRank && ` · ${r.beltRank}`}
                        </span>
                      </p>
                      <p className="text-xs text-ink/60">
                        DOB {r.dateOfBirth} · {r.classTime} · {r.sessionLabel} · ${r.sessionFeeCharged || "0"} charged
                      </p>
                    </div>
                    <button
                      onClick={() => togglePaid(r)}
                      className={`text-xs px-3 py-1.5 font-display tracking-wide shrink-0 ${
                        r.paid ? "bg-mat text-card" : "bg-belt text-card"
                      }`}
                    >
                      {r.paid ? "Paid ✓" : "Mark paid"}
                    </button>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1 text-sm text-ink/80 mb-2">
                    <p>
                      <span className="text-ink/50">Guardian:</span> {r.guardianFirstName} {r.guardianLastName} ·{" "}
                      {r.guardianEmail} · {r.guardianPhone}
                    </p>
                    {r.guardian2FirstName && (
                      <p>
                        <span className="text-ink/50">Guardian 2:</span> {r.guardian2FirstName} {r.guardian2LastName}
                        {r.guardian2Email && ` · ${r.guardian2Email}`}
                        {r.guardian2Phone && ` · ${r.guardian2Phone}`}
                      </p>
                    )}
                    <p>
                      <span className="text-ink/50">Emergency:</span> {r.emergencyContact} · {r.emergencyPhone}
                    </p>
                    <p>
                      <span className="text-ink/50">Insurance:</span>{" "}
                      {r.membershipStatus === "current" && r.membershipIdNumber ? (
                        r.membershipExpires && isExpired(r.membershipExpires) ? (
                          <span className="text-belt font-display">
                            EXPIRED {r.membershipExpires} — {r.membershipOrg || "USJF"} #{r.membershipIdNumber}
                          </span>
                        ) : (
                          `${r.membershipOrg || "on file"} #${r.membershipIdNumber}${
                            r.membershipExpires ? " · expires " + r.membershipExpires : " (needs verification)"
                          }`
                        )
                      ) : r.membershipStatus === "current" ? (
                        <span className="text-belt font-display">Incomplete — missing USJF # on file</span>
                      ) : (
                        <span className="text-belt font-display">Not confirmed — insurance gap</span>
                      )}
                      {hasInsuranceIssue && (
                        <button
                          onClick={() => sendReminder(r)}
                          disabled={reminderState[r.rowNumber] === "sending" || reminderState[r.rowNumber] === "sent"}
                          className="ml-3 text-xs underline text-belt disabled:opacity-50"
                        >
                          {reminderState[r.rowNumber] === "sending"
                            ? "Sending…"
                            : reminderState[r.rowNumber] === "sent"
                            ? "Reminder sent ✓"
                            : reminderState[r.rowNumber]
                            ? `Failed: ${reminderState[r.rowNumber]}`
                            : "Send reminder"}
                        </button>
                      )}
                    </p>
                    <p>
                      <span className="text-ink/50">Waiver signed by:</span> {r.signedByName}
                      {r.timestamp && ` on ${new Date(r.timestamp).toLocaleDateString()}`}
                    </p>
                    <p>
                      <span className="text-ink/50">Photo consent:</span>{" "}
                      {r.photoConsent === "yes" ? "Yes" : r.photoConsent === "no" ? "No" : "Not recorded"}
                    </p>
                  </div>
                  {(r.giSize || r.familyExtrasNote) && (
                    <div className="bg-gold/20 border border-gold/40 p-3 mt-3">
                      <p className="font-display text-lg mb-1">Purchases</p>
                      {r.giSize && (
                        <p className="text-sm">
                          <strong>Gi:</strong> {r.giSize}{typeof giPrice === "number" ? ` — $${giPrice}` : ""}
                        </p>
                      )}
                      {r.familyExtrasNote && (
                        <p className="text-sm">
                          <strong>Family items:</strong> {r.familyExtrasNote}
                        </p>
                      )}
                    </div>
                  )}
                  {r.hasMedicalConditions === "Yes" && r.medicalNotes && (
                    <p className="text-sm bg-belt/10 border border-belt/30 p-2 mt-2">
                      <span className="text-belt">Medical notes:</span> {r.medicalNotes}
                    </p>
                  )}
                  {r.hasMedicalConditions === "No" && (
                    <p className="text-xs text-mat mt-2">No medical conditions reported</p>
                  )}
                  {!r.hasMedicalConditions && (
                    <p className="text-xs text-ink/40 mt-2">Medical question not answered (registered before this was added)</p>
                  )}
                  {r.autoRenew && <p className="text-xs text-belt mt-2">Auto-renew enabled for next quarter</p>}
                </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {tab === "events" && (
        <section className="max-w-2xl">
          <h2 className="mb-3 font-display text-3xl">Current event flyer</h2>
          <p className="mb-8 leading-relaxed text-ink/60">
            Upload a PDF here whenever event information changes. The new file automatically replaces
            the flyer on the public Events page.
          </p>

          {eventDocument && (
            <div className="mb-8 border border-ink/15 bg-card p-5">
              <p className="font-display text-xl">{eventDocument.title}</p>
              <p className="mt-1 text-sm text-ink/55">
                Uploaded {new Date(eventDocument.uploadedAt).toLocaleDateString()}
              </p>
              <a
                href={eventDocument.url}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-block text-sm underline decoration-belt decoration-2 underline-offset-2"
              >
                View current PDF
              </a>
            </div>
          )}

          <label className="mb-5 block text-sm text-ink/65">
            Flyer title
            <input
              value={eventTitle}
              maxLength={100}
              onChange={(e) => setEventTitle(e.target.value)}
              disabled={eventUploading}
            />
          </label>
          <label className="mb-5 block text-sm text-ink/65">
            PDF file · maximum 10 MB
            <input
              key={eventFile?.name || "empty"}
              type="file"
              accept="application/pdf,.pdf"
              disabled={eventUploading}
              onChange={(e) => {
                const file = e.target.files?.[0] || null;
                setEventFile(file);
                setEventMessage("");
              }}
            />
          </label>

          {eventUploading && (
            <div className="mb-5" aria-live="polite">
              <div className="h-2 overflow-hidden bg-ink/10">
                <div className="h-full bg-mat transition-all" style={{ width: `${eventProgress}%` }} />
              </div>
              <p className="mt-2 text-sm text-ink/60">Uploading… {eventProgress}%</p>
            </div>
          )}
          {eventMessage && (
            <p className={`mb-5 text-sm ${eventMessage.startsWith("Uploaded") ? "text-mat" : "text-belt"}`}>
              {eventMessage}
            </p>
          )}

          <button
            onClick={uploadEventPdf}
            disabled={!eventFile || eventUploading}
            className="bg-belt px-6 py-3 font-display text-lg tracking-wide text-card disabled:opacity-30"
          >
            {eventUploading ? "Uploading…" : eventDocument ? "Replace events PDF" : "Upload events PDF"}
          </button>
        </section>
      )}

      {tab === "settings" && (
      <section>
      <p className="text-ink/60 mb-10">
        Edit dates, prices, and class times below, then save. Changes go live on the site within
        a few seconds — no code, no redeploy needed.
      </p>

      <h2 className="font-display text-2xl mb-4">Sessions</h2>
      <div className="space-y-6 mb-12">
        {sessions.map((s, i) => (
          <div key={s.id} className="bg-card border border-ink/15 p-5 grid sm:grid-cols-2 gap-4">
            <label className="text-xs text-ink/60 sm:col-span-2">
              Label
              <input value={s.label} onChange={(e) => updateSession(i, { label: e.target.value })} />
            </label>
            <label className="text-xs text-ink/60">
              Dates
              <input value={s.dates} onChange={(e) => updateSession(i, { dates: e.target.value })} />
            </label>
            <label className="text-xs text-ink/60">
              Pricing type
              <select
                value={s.pricingMode}
                onChange={(e) => updateSession(i, { pricingMode: e.target.value as "family_tier" | "flat" })}
              >
                <option value="family_tier">Family-tiered (1st/2nd/3rd+ child)</option>
                <option value="flat">Flat rate</option>
              </select>
            </label>
            {s.pricingMode === "flat" ? (
              <label className="text-xs text-ink/60 sm:col-span-2">
                Flat price ($)
                <input
                  type="number"
                  value={s.flatPrice ?? 0}
                  onChange={(e) => updateSession(i, { flatPrice: Number(e.target.value) })}
                />
              </label>
            ) : (
              <>
                <label className="text-xs text-ink/60">
                  1st student ($)
                  <input
                    type="number"
                    value={s.familyTierFirst ?? 0}
                    onChange={(e) => updateSession(i, { familyTierFirst: Number(e.target.value) })}
                  />
                </label>
                <label className="text-xs text-ink/60">
                  2nd student ($)
                  <input
                    type="number"
                    value={s.familyTierSecond ?? 0}
                    onChange={(e) => updateSession(i, { familyTierSecond: Number(e.target.value) })}
                  />
                </label>
                <label className="text-xs text-ink/60">
                  3rd+ student ($)
                  <input
                    type="number"
                    value={s.familyTierThirdPlus ?? 0}
                    onChange={(e) => updateSession(i, { familyTierThirdPlus: Number(e.target.value) })}
                  />
                </label>
              </>
            )}
            <label className="text-xs text-ink/60 sm:col-span-2">
              Registration window
              <input value={s.regWindow} onChange={(e) => updateSession(i, { regWindow: e.target.value })} />
            </label>
            <label className="text-xs text-ink/60 sm:col-span-2">
              Note (breaks, closures — optional)
              <input value={s.note ?? ""} onChange={(e) => updateSession(i, { note: e.target.value })} />
            </label>
            <label className="flex items-center gap-2 text-sm sm:col-span-2 mt-1">
              <input
                type="checkbox"
                checked={s.registrationOpen !== false}
                onChange={(e) => updateSession(i, { registrationOpen: e.target.checked })}
              />
              Registration open
            </label>
            <label className="flex items-center gap-2 text-sm sm:col-span-2 mt-1">
              <input
                type="checkbox"
                checked={s.allowNew}
                onChange={(e) => updateSession(i, { allowNew: e.target.checked })}
              />
              New students allowed
            </label>
          </div>
        ))}
      </div>

      <h2 className="font-display text-2xl mb-4">Class Times</h2>
      <div className="space-y-4 mb-12">
        {classTimes.map((c, i) => (
          <div key={c.id} className="bg-card border border-ink/15 p-5 grid sm:grid-cols-3 gap-4">
            <label className="text-xs text-ink/60">
              Label
              <input value={c.label} onChange={(e) => updateClassTime(i, { label: e.target.value })} />
            </label>
            <label className="text-xs text-ink/60">
              Age range
              <input value={c.age} onChange={(e) => updateClassTime(i, { age: e.target.value })} />
            </label>
            <label className="text-xs text-ink/60">
              Time
              <input value={c.time} onChange={(e) => updateClassTime(i, { time: e.target.value })} />
            </label>
          </div>
        ))}
      </div>

      <label className="block text-xs text-ink/60 max-w-xs mb-8">
        Annual USJF membership fee ($)
        <input
          type="number"
          value={membershipFee}
          onChange={(e) => setMembershipFee(Number(e.target.value))}
        />
      </label>

      {error && <p className="text-belt text-sm mb-4">{error}</p>}
      {saved && <p className="text-mat text-sm mb-4">Saved — the site is now updated.</p>}

      <button
        disabled={loading}
        onClick={save}
        className="bg-belt text-card px-6 py-3 font-display text-lg tracking-wide disabled:opacity-30"
      >
        {loading ? "Saving..." : "Save changes"}
      </button>
      </section>
      )}
    </main>
  );
}
