"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-client";

type Profile = {
  user_id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  date_of_birth: string | null;
  phone: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  medical_conditions: boolean;
  medical_notes: string | null;
  belt_rank: string | null;
  membership_org: string | null;
  membership_number: string | null;
  membership_expires: string | null;
  membership_auto_renew: "yes" | "no" | "not_sure";
};

type Certification = {
  id: number;
  certification_type: string;
  certification_number: string | null;
  issued_date: string | null;
  expires_date: string | null;
  notes: string | null;
};

type SessionRegistration = {
  id: number;
  session_id: string;
  session_label: string;
  class_selection: "class_1" | "class_2" | "both";
  status: string;
};

const CERT_TYPES = [
  "USA Judo Coach",
  "SafeSport",
  "CDC Concussion",
  "Background Screening",
  "First Aid / CPR / AED",
];

function emptyProfile(userId: string, email: string, metadata?: Record<string, any>): Profile {
  return {
    user_id: userId,
    email,
    first_name: metadata?.first_name ?? "",
    last_name: metadata?.last_name ?? "",
    date_of_birth: "",
    phone: "",
    address_line1: "",
    address_line2: "",
    city: "",
    state: "",
    postal_code: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    medical_conditions: false,
    medical_notes: "",
    belt_rank: "",
    membership_org: "USJF",
    membership_number: "",
    membership_expires: "",
    membership_auto_renew: "not_sure",
  };
}

export default function InstructorPortalPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [certs, setCerts] = useState<Certification[]>([]);
  const [registrations, setRegistrations] = useState<SessionRegistration[]>([]);
  const [sessions, setSessions] = useState<{id:string;label:string}[]>([]);
  const [selectedSession, setSelectedSession] = useState("");
  const [classSelection, setClassSelection] = useState<"class_1"|"class_2"|"both">("both");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"home" | "profile" | "certifications" | "sessions">("home");
  const [newCert, setNewCert] = useState({ certification_type: CERT_TYPES[0], certification_number: "", issued_date: "", expires_date: "", notes: "" });

  async function load() {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      router.replace("/instructor-login");
      return;
    }

    const user = auth.user;
    const [{ data: p }, { data: c }, { data: r }] = await Promise.all([
      supabase.from("instructor_profiles").select("*").eq("user_id", user.id).maybeSingle(),
      supabase.from("instructor_certifications").select("*").order("certification_type"),
      supabase.from("instructor_session_registrations").select("*").order("registered_at", { ascending: false }),
    ]);

    if (p) {
      setProfile(p as Profile);
    } else {
      const initial = emptyProfile(user.id, user.email || "", user.user_metadata);
      await supabase.from("instructor_profiles").insert(initial);
      setProfile(initial);
    }
    setCerts((c || []) as Certification[]);
    setRegistrations((r || []) as SessionRegistration[]);

    fetch("/api/site-config")
      .then(res => res.json())
      .then(config => {
        const list = (config.sessions || []).map((s:any)=>({id:s.id,label:s.label}));
        setSessions(list);
        if (list[0]) setSelectedSession(list[0].id);
      })
      .catch(()=>{});

    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const existingSessionIds = useMemo(() => new Set(registrations.map(r => r.session_id)), [registrations]);

  async function saveProfile(e: FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    setMessage("");
    const { error } = await supabase.from("instructor_profiles").upsert({
      ...profile,
      updated_at: new Date().toISOString(),
    });
    setMessage(error ? error.message : "Profile saved.");
    setSaving(false);
  }

  async function addCertification(e: FormEvent) {
    e.preventDefault();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return;
    const { error } = await supabase.from("instructor_certifications").insert({
      user_id: auth.user.id,
      ...newCert,
      certification_number: newCert.certification_number || null,
      issued_date: newCert.issued_date || null,
      expires_date: newCert.expires_date || null,
      notes: newCert.notes || null,
    });
    if (error) setMessage(error.message);
    else {
      setNewCert({ certification_type: CERT_TYPES[0], certification_number: "", issued_date: "", expires_date: "", notes: "" });
      await load();
      setMessage("Certification added.");
    }
  }

  async function deleteCertification(id: number) {
    await supabase.from("instructor_certifications").delete().eq("id", id);
    await load();
  }

  async function registerSession() {
    const { data: auth } = await supabase.auth.getUser();
    const session = sessions.find(s => s.id === selectedSession);
    if (!auth.user || !session) return;
    const { error } = await supabase.from("instructor_session_registrations").upsert({
      user_id: auth.user.id,
      session_id: session.id,
      session_label: session.label,
      class_selection: classSelection,
      status: "registered",
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id,session_id" });
    if (error) setMessage(error.message);
    else {
      await load();
      setMessage(`Registration confirmed for ${session.label} — ${classSelection === "both" ? "Both classes" : classSelection === "class_1" ? "Class 1" : "Class 2"}.`);
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/instructor-login");
  }

  if (loading || !profile) {
    return <main className="mx-auto max-w-5xl px-6 py-24 text-center text-ink/50">Loading instructor portal…</main>;
  }

  const update = (key: keyof Profile, value: any) => setProfile({ ...profile, [key]: value });

  function certStatus(cert: Certification) {
    if (!cert.expires_date) return "No expiration entered";
    const expires = new Date(cert.expires_date + "T00:00:00");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return expires < today ? `Expired ${cert.expires_date}` : `Expires ${cert.expires_date}`;
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-12 sm:py-16">
      <div className="mb-10 flex flex-col justify-between gap-4 border-b border-ink/15 pb-6 sm:flex-row sm:items-end">
        <div>
          <p className="font-display uppercase tracking-[0.14em] text-belt">Instructor Portal</p>
          <h1 className="font-display text-5xl leading-none">Welcome{profile.first_name ? `, ${profile.first_name}` : ""}</h1>
          <p className="mt-3 text-ink/65">Keep your profile, membership, certifications, and session availability current.</p>
        </div>
        <button onClick={signOut} className="border border-ink/25 px-5 py-2 font-display text-lg">Sign out</button>
      </div>

      {message && <div className="mb-4 border border-belt/30 bg-belt/5 p-4 text-sm">{message}</div>}

      <nav className="mb-8 grid grid-cols-2 gap-2 sm:grid-cols-4" aria-label="Instructor portal sections">
        {[
          ["home", "Home"],
          ["profile", "Update Profile"],
          ["certifications", "Certifications"],
          ["sessions", "Session Registration"],
        ].map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveTab(id as "home" | "profile" | "certifications" | "sessions")}
            className={`px-4 py-3 font-display text-lg ${activeTab === id ? "bg-ink text-canvas" : "border border-ink/20 bg-card text-ink"}`}
          >
            {label}
          </button>
        ))}
      </nav>

      {activeTab === "home" && registrations.length > 0 && (
        <div className="mb-10 border border-ink/15 bg-card p-5 sm:flex sm:items-center sm:justify-between sm:gap-6">
          <div>
            <p className="font-display text-2xl">Current Session Registration</p>
            <p className="mt-1 text-ink/75">
              {registrations[0].session_label} · {registrations[0].class_selection === "both" ? "Both classes" : registrations[0].class_selection === "class_1" ? "Class 1" : "Class 2"}
            </p>
            <p className="mt-1 text-sm text-ink/55">Status: Registered · No payment required</p>
          </div>
          <a href="#session-registration" className="mt-4 inline-block border border-ink/25 px-5 py-2 font-display text-lg sm:mt-0">
            View / Update
          </a>
        </div>
      )}

      {activeTab === "home" && (
        <section className="mb-12">
          <h2 className="mb-5 font-display text-3xl">Membership & Certification Status</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <article className="border border-ink/15 bg-card p-5">
              <p className="font-display text-xl">Judo Membership</p>
              <p className="mt-2 text-sm text-ink/70">
                {profile.membership_org || "Membership organization not entered"}
              </p>
              <p className="mt-1 text-sm text-ink/60">
                {profile.membership_number ? `#${profile.membership_number}` : "Membership number not entered"}
              </p>
              <p className="mt-1 text-sm text-ink/60">
                {profile.membership_expires ? `Expires ${profile.membership_expires}` : "Expiration not entered"}
              </p>
              <button type="button" onClick={() => setActiveTab("profile")} className="mt-4 text-sm font-semibold text-belt underline">
                Update profile
              </button>
            </article>

            {certs.map((cert) => (
              <article key={cert.id} className="border border-ink/15 bg-card p-5">
                <p className="font-display text-xl">{cert.certification_type}</p>
                <p className="mt-2 text-sm text-ink/60">{certStatus(cert)}</p>
                {cert.certification_number && <p className="mt-1 text-xs text-ink/50">#{cert.certification_number}</p>}
              </article>
            ))}

            {certs.length === 0 && (
              <article className="border border-belt/30 bg-belt/5 p-5 md:col-span-2">
                <p className="font-display text-xl">No certifications entered yet</p>
                <button type="button" onClick={() => setActiveTab("certifications")} className="mt-3 text-sm font-semibold text-belt underline">
                  Add certifications
                </button>
              </article>
            )}
          </div>
        </section>
      )}

      {activeTab === "profile" && (
      <section className="mb-12">
        <h2 className="mb-5 font-display text-3xl">Update Profile</h2>
        <form onSubmit={saveProfile} className="grid gap-5 border border-ink/15 bg-card p-6 md:grid-cols-2">
          <label className="text-sm">First name<input value={profile.first_name || ""} onChange={e=>update("first_name",e.target.value)} /></label>
          <label className="text-sm">Last name<input value={profile.last_name || ""} onChange={e=>update("last_name",e.target.value)} /></label>
          <label className="text-sm">Date of birth<input type="date" value={profile.date_of_birth || ""} onChange={e=>update("date_of_birth",e.target.value)} /></label>
          <label className="text-sm">Phone<input value={profile.phone || ""} onChange={e=>update("phone",e.target.value)} /></label>
          <label className="text-sm md:col-span-2">Address<input value={profile.address_line1 || ""} onChange={e=>update("address_line1",e.target.value)} /></label>
          <label className="text-sm md:col-span-2">Address line 2<input value={profile.address_line2 || ""} onChange={e=>update("address_line2",e.target.value)} /></label>
          <label className="text-sm">City<input value={profile.city || ""} onChange={e=>update("city",e.target.value)} /></label>
          <label className="text-sm">State<input value={profile.state || ""} onChange={e=>update("state",e.target.value)} /></label>
          <label className="text-sm">ZIP / postal code<input value={profile.postal_code || ""} onChange={e=>update("postal_code",e.target.value)} /></label>
          <label className="text-sm">Belt rank<input value={profile.belt_rank || ""} onChange={e=>update("belt_rank",e.target.value)} /></label>

          <div className="md:col-span-2 mt-2 border-t border-ink/10 pt-5">
            <h3 className="font-display text-xl">Emergency & Medical</h3>
          </div>
          <label className="text-sm">Emergency contact<input value={profile.emergency_contact_name || ""} onChange={e=>update("emergency_contact_name",e.target.value)} /></label>
          <label className="text-sm">Emergency phone<input value={profile.emergency_contact_phone || ""} onChange={e=>update("emergency_contact_phone",e.target.value)} /></label>
          <label className="flex items-center gap-3 text-sm md:col-span-2">
            <input type="checkbox" checked={profile.medical_conditions} onChange={e=>update("medical_conditions",e.target.checked)} />
            I have medical conditions, allergies, medications, or limitations instructors should know about.
          </label>
          <label className="text-sm md:col-span-2">Medical notes<textarea rows={3} value={profile.medical_notes || ""} onChange={e=>update("medical_notes",e.target.value)} /></label>

          <div className="md:col-span-2 mt-2 border-t border-ink/10 pt-5">
            <h3 className="font-display text-xl">Judo Membership</h3>
          </div>
          <label className="text-sm">Organization<select value={profile.membership_org || "USJF"} onChange={e=>update("membership_org",e.target.value)}><option>USJF</option><option>USA Judo</option><option>Both</option></select></label>
          <label className="text-sm">Membership number<input value={profile.membership_number || ""} onChange={e=>update("membership_number",e.target.value)} /></label>
          <label className="text-sm">Expiration date<input type="date" value={profile.membership_expires || ""} onChange={e=>update("membership_expires",e.target.value)} /></label>
          <label className="text-sm">Auto-renew<select value={profile.membership_auto_renew} onChange={e=>update("membership_auto_renew",e.target.value)}><option value="yes">Yes</option><option value="no">No</option><option value="not_sure">Not sure</option></select></label>

          <div className="md:col-span-2">
            <button disabled={saving} className="bg-belt px-6 py-3 font-display text-lg tracking-wide text-card disabled:opacity-50">
              {saving ? "Saving…" : "Save profile"}
            </button>
          </div>
        </form>
      </section>
      )}

      {activeTab === "certifications" && (
      <section className="mb-12">
        <h2 className="mb-5 font-display text-3xl">Certifications</h2>
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="border border-ink/15 bg-card">
            {certs.length === 0 ? (
              <p className="p-6 text-ink/60">No certifications entered yet.</p>
            ) : certs.map(cert => (
              <div key={cert.id} className="flex items-start justify-between gap-4 border-b border-ink/10 p-5 last:border-b-0">
                <div>
                  <p className="font-display text-xl">{cert.certification_type}</p>
                  <p className="mt-1 text-sm text-ink/65">
                    {cert.certification_number && `#${cert.certification_number} · `}
                    {cert.expires_date ? `Expires ${cert.expires_date}` : "No expiration entered"}
                  </p>
                  {cert.notes && <p className="mt-2 text-sm text-ink/70">{cert.notes}</p>}
                </div>
                <button onClick={()=>deleteCertification(cert.id)} className="text-xs underline text-belt">Remove</button>
              </div>
            ))}
          </div>

          <form onSubmit={addCertification} className="border border-ink/15 bg-card p-5">
            <h3 className="mb-4 font-display text-2xl">Add Certification</h3>
            <select value={newCert.certification_type} onChange={e=>setNewCert({...newCert, certification_type:e.target.value})}>
              {CERT_TYPES.map(type=><option key={type}>{type}</option>)}
            </select>
            <input placeholder="Certificate / ID number (optional)" value={newCert.certification_number} onChange={e=>setNewCert({...newCert,certification_number:e.target.value})}/>
            <label className="block text-sm">Date issued<input type="date" value={newCert.issued_date} onChange={e=>setNewCert({...newCert,issued_date:e.target.value})}/></label>
            <label className="block text-sm">Expiration date<input type="date" value={newCert.expires_date} onChange={e=>setNewCert({...newCert,expires_date:e.target.value})}/></label>
            <textarea rows={2} placeholder="Notes (optional)" value={newCert.notes} onChange={e=>setNewCert({...newCert,notes:e.target.value})}/>
            <button className="mt-2 bg-ink px-5 py-3 font-display text-lg text-canvas">Add certification</button>
          </form>
        </div>
      </section>
      )}

      {activeTab === "sessions" && (
      <section id="session-registration">
        <h2 className="mb-5 font-display text-3xl">Session Registration</h2>
        <div className="grid gap-6 border border-ink/15 bg-mat/10 p-6 md:grid-cols-[1fr_1fr_auto] md:items-end">
          <label className="text-sm">Session<select value={selectedSession} onChange={e=>setSelectedSession(e.target.value)}>{sessions.map(s=><option key={s.id} value={s.id}>{s.label}</option>)}</select></label>
          <label className="text-sm">Class<select value={classSelection} onChange={e=>setClassSelection(e.target.value as any)}><option value="class_1">Class 1</option><option value="class_2">Class 2</option><option value="both">Both classes</option></select></label>
          <button onClick={registerSession} disabled={!selectedSession} className="bg-belt px-6 py-3 font-display text-lg text-card disabled:opacity-40">
            {existingSessionIds.has(selectedSession) ? "Update registration" : "Register"}
          </button>
        </div>

        {registrations.length > 0 && (
          <div className="mt-5 border-t border-ink/15">
            {registrations.map(r=>(
              <div key={r.id} className="grid gap-2 border-b border-ink/10 py-4 sm:grid-cols-[1fr_auto]">
                <div>
                  <p className="font-display text-xl">{r.session_label}</p>
                  <p className="text-sm text-ink/60">{r.class_selection === "both" ? "Both classes" : r.class_selection === "class_1" ? "Class 1" : "Class 2"}</p>
                </div>
                <span className="text-sm uppercase tracking-wide text-mat">{r.status}</span>
              </div>
            ))}
          </div>
        )}
      </section>
      )}
    </main>
  );
}
