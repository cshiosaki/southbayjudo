"use client";

import { useEffect, useState } from "react";
import type { SessionConfig } from "@/lib/sessions";

type Stage = "email" | "contact" | "session" | "credentials" | "health" | "review" | "complete";
type Form = {
  firstName: string; lastName: string; email: string; phone: string;
  sessionId: string; classes: string[]; beltRank: string;
  usjfNumber: string; usjfExpires: string; usjfAutoRenew: string;
  usaNumber: string; usaExpires: string; usaCoachCert: string;
  usaCoachExpires: string; safeSportExpires: string; cdcExpires: string;
  backgroundExpires: string; cprExpires: string;
  emergencyContact: string; emergencyPhone: string;
  hasMedicalConditions: string; medicalNotes: string;
  waiverAccepted: boolean; codeOfConductAccepted: boolean; signedBy: string;
};
const initial: Form = {
  firstName:"",lastName:"",email:"",phone:"",sessionId:"",classes:[],beltRank:"",
  usjfNumber:"",usjfExpires:"",usjfAutoRenew:"Not sure",
  usaNumber:"",usaExpires:"",usaCoachCert:"",usaCoachExpires:"",
  safeSportExpires:"",cdcExpires:"",backgroundExpires:"",cprExpires:"",
  emergencyContact:"",emergencyPhone:"",hasMedicalConditions:"",medicalNotes:"",
  waiverAccepted:false,codeOfConductAccepted:false,signedBy:"",
};
const classes = [
  { id: "Class 1", label: "Class 1 — Juniors 5–12" },
  { id: "Class 2", label: "Class 2 — Juniors 5–14" },
  { id: "Class 3", label: "Class 3 — Older youth and adults 13+" },
];
const order: Stage[] = ["contact","session","credentials","health","review"];
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export default function InstructorRegistrationFlow({
  testMode = false,
  testPassword = "",
}: { testMode?: boolean; testPassword?: string }) {
  const [stage,setStage] = useState<Stage>(testMode ? "contact" : "email");
  const [form,setForm] = useState<Form>(initial);
  const [sessions,setSessions] = useState<SessionConfig[]>([]);
  const [loading,setLoading] = useState(true);
  const [busy,setBusy] = useState(false);
  const [message,setMessage] = useState("");
  const [verifiedToken,setVerifiedToken] = useState("");
  const [previousFound,setPreviousFound] = useState(false);
  const [result,setResult] = useState<{status:string; needsAttention:string[]; action?:string} | null>(null);
  const change = (patch:Partial<Form>) => setForm((current)=>({...current,...patch}));

  useEffect(()=>{
    fetch("/api/site-config")
      .then((r)=>r.json())
      .then((d)=>{
        const available:SessionConfig[] = (d.sessions || []).filter((s:SessionConfig)=>
          testMode ? s.id === "sess_2027_1q" : s.registrationOpen !== false);
        setSessions(available);
        if (available.length) setForm((prev)=>({...prev,sessionId:prev.sessionId||available[0].id}));
      })
      .catch(()=>setMessage("Unable to load current sessions."))
      .finally(()=>setLoading(false));
  },[testMode]);

  useEffect(()=>{
    if (testMode) return;
    const token = new URLSearchParams(window.location.hash.replace(/^#/,"")).get("verify");
    if (!token) return;
    window.history.replaceState(null,"",window.location.pathname+window.location.search);
    setBusy(true); setMessage("Verifying your email and loading existing instructor details...");
    fetch("/api/instructor-register/verify-token", {
      method:"POST",headers:{"Content-Type":"application/json"},
      body:JSON.stringify({token}),
    })
      .then(async (response)=>{
        const data = await response.json();
        if (!response.ok) throw new Error(data.error||"Verification failed.");
        return data;
      })
      .then((data)=>{
        setVerifiedToken(token);
        setPreviousFound(!!data.previous);
        setForm((current)=>({
          ...current,
          ...(data.previous || {}),
          email:data.email,
          classes:[],
          sessionId:current.sessionId,
          waiverAccepted:false,codeOfConductAccepted:false,signedBy:"",
        }));
        setMessage(data.previous
          ?"Email verified. Your previous instructor information is filled in for review."
          :"Email verified. Please complete your instructor details.");
        setStage("contact");
      })
      .catch((error)=>{
        setMessage(error instanceof Error ? error.message : "Email verification failed.");
        setStage("email");
      })
      .finally(()=>setBusy(false));
  },[testMode]);

  async function sendVerification() {
    if (!emailPattern.test(form.email.trim())) {setMessage("Enter a valid email address.");return;}
    setBusy(true); setMessage("");
    try {
      const response=await fetch("/api/instructor-register/verify-email",{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({email:form.email}),
      });
      const data=await response.json();
      if (!response.ok) throw new Error(data.error||"Could not send email.");
      setMessage(data.message||"Check your email for the verification link.");
    } catch(error) {
      setMessage(error instanceof Error?error.message:"Could not send email.");
    } finally {setBusy(false);}
  }
  function next(to:Stage) {setMessage("");setStage(to);window.scrollTo({top:0,behavior:"smooth"});}
  function toggleClass(id:string) {
    change({classes:form.classes.includes(id)?form.classes.filter((x)=>x!==id):[...form.classes,id]});
  }
  async function submit() {
    setBusy(true);setMessage("");
    try {
      const response=await fetch("/api/instructor-register/submit",{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({form,verificationToken:verifiedToken,...(testMode?{testMode:true,testPassword}:{})}),
      });
      const data=await response.json();
      if (!response.ok) throw new Error(data.error||"Registration could not be completed.");
      setResult(data);next("complete");
    } catch(error) {
      setMessage(error instanceof Error?error.message:"Registration could not be completed.");
    } finally {setBusy(false);}
  }

  const input = (label:string,key:keyof Form,type="text",required=false) => (
    <label className="block text-sm">
      <span className="block mb-1 text-ink/75">{label}{required?" *":""}</span>
      <input
        type={type} required={required} value={String(form[key])}
        onChange={(e)=>change({[key]:e.target.value})}
        className="w-full"
      />
    </label>
  );
  return (
    <main className="max-w-2xl mx-auto px-6 py-12 sm:py-16">
      {testMode && <div className="mb-6 bg-ink px-4 py-3 font-semibold text-white">TEST MODE — No data saved or emails sent</div>}
      <p className="mb-2 text-sm font-display uppercase tracking-[0.16em] text-belt">South Bay Judo</p>
      <h1 className="font-display text-4xl sm:text-5xl mb-3">Instructor &amp; Volunteer Registration</h1>
      <p className="text-ink/65 mb-7">Register for a session, indicate the classes you can teach, and keep your membership and safety credentials current. There is no tuition charge for instructors.</p>
      {stage!=="email" && stage!=="complete" && (
        <div className="mb-8 flex flex-wrap gap-2" aria-label="Registration steps">
          {order.map((item,i)=>(
            <span key={item} className={"rounded-sm px-3 py-1 text-xs "+(item===stage?"bg-belt text-white":"bg-card border border-ink/15 text-ink/65")}>
              {i+1}. {item==="contact"?"Contact":item==="session"?"Classes":item==="credentials"?"Credentials":item==="health"?"Emergency & Waiver":"Review"}
            </span>
          ))}
        </div>
      )}
      {message && <p role="status" className="mb-6 border border-ink/15 bg-card p-4 text-sm text-ink/85">{message}</p>}
      {loading || busy && message.includes("Verifying your email") ? (
        <p>Loading registration...</p>
      ) : (
        <>
        {stage==="email" && (
          <section className="space-y-5 bg-card p-6 border border-ink/15">
            <h2 className="font-display text-2xl">Verify your email to begin</h2>
            <p className="text-sm text-ink/70">
              Use your own email address. We'll send a secure verification link before loading any
              previous instructor details or accepting a registration.
            </p>
            {input("Email address","email","email",true)}
            <button onClick={sendVerification} disabled={busy || !emailPattern.test(form.email.trim())}
              className="bg-belt text-white px-5 py-3 font-display disabled:opacity-30">
              {busy?"Sending...":"Send verification link"}
            </button>
            <p className="text-sm text-ink/60">If you don't receive the email, check spam and try again.</p>
          </section>
        )}
        {stage==="contact" && (
          <section className="space-y-6">
            <h2 className="font-display text-2xl">Your contact information</h2>
            {previousFound && <p className="text-sm text-belt">Returning instructor details loaded. Please confirm everything is still correct.</p>}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {input("First name","firstName","text",true)}
              {input("Last name","lastName","text",true)}
              {input("Email address","email","email",true)}
              {input("Phone","phone","tel",true)}
            </div>
            {!testMode && <p className="text-xs text-ink/60">For security, your final registration email must match the email you verified.</p>}
            {input("Current belt rank (if known)","beltRank")}
            <button disabled={!form.firstName.trim()||!form.lastName.trim()||!emailPattern.test(form.email)||!form.phone.trim()}
              onClick={()=>next("session")} className="bg-belt text-white px-5 py-3 font-display disabled:opacity-30">Continue to classes</button>
          </section>
        )}
        {stage==="session" && (
          <section className="space-y-6">
            <h2 className="font-display text-2xl">Choose a session &amp; classes</h2>
            {sessions.length===0 ? (
              <p className="text-sm text-belt">No instructor registration sessions are currently open. Winter 2027 is scheduled to open December 14.</p>
            ) : (
              <div className="space-y-4">
                <label className="block text-sm">
                  <span className="block mb-1">Session</span>
                  <select value={form.sessionId} onChange={(e)=>change({sessionId:e.target.value})} className="w-full">
                    {sessions.map((s)=><option key={s.id} value={s.id}>{s.label} — {s.dates}</option>)}
                  </select>
                </label>
                <div className="border border-ink/15 bg-card p-4">
                  <p className="font-display text-xl mb-2">Classes you can teach or assist</p>
                  <p className="text-sm text-ink/65 mb-4">Select all that apply. Instructors are listed separately from student tuition registrations.</p>
                  <div className="space-y-3">
                    {classes.map((c)=>(
                      <label key={c.id} className="flex items-center gap-3">
                        <input type="checkbox" checked={form.classes.includes(c.id)} onChange={()=>toggleClass(c.id)}/>
                        <span>{c.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div className="flex gap-3">
              <button className="underline text-ink/60" onClick={()=>next("contact")}>Back</button>
              <button disabled={!form.sessionId||form.classes.length===0} onClick={()=>next("credentials")}
                className="bg-belt text-white px-5 py-3 font-display disabled:opacity-30">Continue to credentials</button>
            </div>
          </section>
        )}
        {stage==="credentials" && (
          <section className="space-y-6">
            <h2 className="font-display text-2xl">Membership &amp; certifications</h2>
            <p className="text-sm text-ink/70">
              Enter existing membership numbers and certification expiration dates. Any missing or
              expired requirements will be marked for follow-up, not automatically approved.
            </p>
            <fieldset className="bg-card border border-ink/15 p-4 space-y-4">
              <legend className="font-display text-xl">USJF membership</legend>
              {input("USJF membership number","usjfNumber")}
              {input("USJF expiration date","usjfExpires","date")}
              <label className="block text-sm"><span className="block mb-1">USJF auto-renewal</span>
                <select value={form.usjfAutoRenew} onChange={(e)=>change({usjfAutoRenew:e.target.value})}>
                  <option>Not sure</option><option>Yes</option><option>No</option>
                </select>
              </label>
            </fieldset>
            <fieldset className="bg-card border border-ink/15 p-4 space-y-4">
              <legend className="font-display text-xl">USA Judo membership &amp; coaching</legend>
              {input("USA Judo membership number (optional)","usaNumber")}
              {input("USA Judo membership expiration","usaExpires","date")}
              {input("USA Judo coach certificate / ID","usaCoachCert")}
              {input("USA Judo coach certificate expiration","usaCoachExpires","date")}
            </fieldset>
            <fieldset className="bg-card border border-ink/15 p-4 space-y-4">
              <legend className="font-display text-xl">Safety certifications</legend>
              {input("SafeSport expiration","safeSportExpires","date")}
              {input("CDC concussion training expiration","cdcExpires","date")}
              {input("Background screening expiration","backgroundExpires","date")}
              {input("First Aid / CPR / AED expiration","cprExpires","date")}
            </fieldset>
            <div className="flex gap-3">
              <button onClick={()=>next("session")} className="underline text-ink/60">Back</button>
              <button onClick={()=>next("health")} className="bg-belt text-white px-5 py-3 font-display">Continue</button>
            </div>
          </section>
        )}
        {stage==="health" && (
          <section className="space-y-6">
            <h2 className="font-display text-2xl">Emergency information &amp; agreements</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {input("Emergency contact name","emergencyContact","text",true)}
              {input("Emergency contact phone","emergencyPhone","tel",true)}
            </div>
            <div>
              <p className="font-semibold mb-3">Medical conditions, allergies, or limitations *</p>
              <div className="flex flex-wrap gap-6">
                {["no","yes"].map((v)=>(
                  <label key={v} className="flex gap-2 items-center">
                    <input type="radio" checked={form.hasMedicalConditions===v} onChange={()=>change({hasMedicalConditions:v})} />
                    {v==="yes"?"Yes":"No"}
                  </label>
                ))}
              </div>
              {form.hasMedicalConditions==="yes" && (
                <label className="block mt-4 text-sm"><span className="block mb-2">Details for instructors and emergency responders</span>
                  <textarea value={form.medicalNotes} onChange={(e)=>change({medicalNotes:e.target.value})}
                    rows={3} className="w-full" placeholder="Include relevant allergies, conditions, or restrictions"/>
                </label>
              )}
            </div>
            <div className="space-y-4 p-5 border border-ink/15 bg-card">
              <p className="text-sm text-ink/70">
                Judo involves physical contact and the risk of injury. By signing, I confirm I understand
                these risks, will disclose relevant medical limitations, and consent to necessary emergency treatment.
              </p>
              <label className="flex gap-3 items-start">
                <input type="checkbox" checked={form.waiverAccepted} onChange={(e)=>change({waiverAccepted:e.target.checked})}/>
                <span className="text-sm">I acknowledge the instructor participation waiver and risks. *</span>
              </label>
              <label className="flex gap-3 items-start">
                <input type="checkbox" checked={form.codeOfConductAccepted} onChange={(e)=>change({codeOfConductAccepted:e.target.checked})}/>
                <span className="text-sm">I agree to follow the club's instructor conduct and safety policies. *</span>
              </label>
              {input("Type your full name as your electronic signature","signedBy","text",true)}
            </div>
            <div className="flex gap-3">
              <button className="underline text-ink/60" onClick={()=>next("credentials")}>Back</button>
              <button disabled={!form.emergencyContact.trim()||!form.emergencyPhone.trim()||
                !form.hasMedicalConditions||!form.waiverAccepted||!form.codeOfConductAccepted||!form.signedBy.trim()}
                onClick={()=>next("review")} className="bg-belt text-white px-5 py-3 font-display disabled:opacity-30">Review registration</button>
            </div>
          </section>
        )}
        {stage==="review" && (
          <section className="space-y-6">
            <h2 className="font-display text-2xl">Review instructor registration</h2>
            <div className="bg-card border border-ink/15 divide-y divide-ink/15 text-sm">
              <div className="p-4"><strong>{form.firstName} {form.lastName}</strong><p>{form.email} · {form.phone}</p></div>
              <div className="p-4"><strong>Session</strong><p>{sessions.find((s)=>s.id===form.sessionId)?.label}</p></div>
              <div className="p-4"><strong>Classes</strong><p>{form.classes.join(", ")}</p></div>
              <div className="p-4"><strong>Membership</strong><p>USJF: {form.usjfNumber||"Needs confirmation"} · Expires: {form.usjfExpires||"Not entered"}</p></div>
              <div className="p-4"><strong>Electronic signature</strong><p>{form.signedBy}</p></div>
              <div className="p-4 text-ink/70">
                No tuition will be charged. Registration is recorded as <strong>Pending Review</strong> until
                South Bay Judo validates instructor requirements.
              </div>
            </div>
            <div className="flex gap-3">
              <button className="underline text-ink/60" onClick={()=>next("health")}>Back</button>
              <button disabled={busy} onClick={submit} className="bg-belt text-white px-5 py-3 font-display disabled:opacity-30">
                {busy?"Submitting...":testMode?"Complete instructor dry run (no save)":"Submit instructor registration"}
              </button>
            </div>
          </section>
        )}
        {stage==="complete" && result && (
          <section className="space-y-4">
            <h2 className="font-display text-3xl">{testMode?"Instructor test successful":"Instructor registration received"}</h2>
            <p>{testMode?"This dry run was validated without writing any data.":"Your instructor registration was saved for club review."}</p>
            <p><strong>Status:</strong> {result.status}</p>
            <p><strong>Needs attention:</strong> {result.needsAttention?.length ? result.needsAttention.join(", "):"None flagged"}</p>
            <p className="text-sm text-ink/60">Requirements must be reviewed by South Bay Judo before an instructor is cleared to teach.</p>
            <a href="/" className="text-belt underline">Return to South Bay Judo</a>
          </section>
        )}
        </>
      )}
    </main>
  );
}
