"use client";

import { useState, type FormEvent } from "react";
import InstructorRegistrationFlow from "@/components/InstructorRegistrationFlow";

export default function TestInstructorRegistrationPage() {
  const [password,setPassword] = useState("");
  const [unlocked,setUnlocked] = useState(false);
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState("");
  async function unlock(event: FormEvent) {
    event.preventDefault();setBusy(true);setError("");
    try {
      const response=await fetch("/api/admin/test-access",{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({password}),
      });
      if (!response.ok) {setError("Incorrect test registration password.");return;}
      setUnlocked(true);
    } catch {setError("Could not verify the test password.");}
    finally {setBusy(false);}
  }
  if (!unlocked) return (
    <main className="max-w-lg mx-auto px-6 py-20">
      <p className="font-display text-belt uppercase tracking-widest mb-2">Private test mode</p>
      <h1 className="font-display text-4xl mb-5">Test instructor registration</h1>
      <p className="text-ink/70 mb-5">Use the same separate test password as January student registration. This dry run never creates a real instructor registration.</p>
      <form onSubmit={unlock} className="space-y-4">
        <label className="block text-sm"><span className="block mb-1">Test password</span>
          <input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} required />
        </label>
        {error && <p role="alert" className="text-belt text-sm">{error}</p>}
        <button disabled={!password||busy} type="submit" className="bg-belt px-6 py-3 font-display text-white disabled:opacity-30">
          {busy?"Verifying...":"Open test instructor form"}
        </button>
      </form>
    </main>
  );
  return <InstructorRegistrationFlow testMode testPassword={password}/>;
}
