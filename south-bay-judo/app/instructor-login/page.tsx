"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase-client";

export default function InstructorLoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login"|"signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace("/instructor-portal");
    });
  }, [router]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setMessage("");

    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setMessage(error.message);
      else router.push("/instructor-portal");
    } else {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { first_name: firstName, last_name: lastName },
          emailRedirectTo: `${window.location.origin}/instructor-portal`,
        },
      });
      if (error) {
        setMessage(error.message);
      } else if (data.session) {
        await supabase.from("instructor_profiles").upsert({
          user_id: data.user!.id,
          email,
          first_name: firstName,
          last_name: lastName,
        });
        router.push("/instructor-portal");
      } else {
        setMessage("Check your email to confirm your account, then return here to sign in.");
      }
    }
    setSubmitting(false);
  }

  return (
    <main className="mx-auto max-w-xl px-6 py-16 sm:py-20">
      <p className="mb-2 font-display uppercase tracking-[0.14em] text-belt">South Bay Judo</p>
      <h1 className="font-display text-5xl leading-none sm:text-6xl">Instructor Portal</h1>
      <p className="mt-4 text-ink/70">
        Manage your instructor profile, emergency and medical information, memberships, certifications, and session registration.
      </p>

      <div className="mt-10 border border-ink/15 bg-card p-6 sm:p-8">
        <div className="mb-6 grid grid-cols-2 gap-2">
          <button type="button" onClick={() => { setMode("login"); setMessage(""); }}
            className={`px-4 py-3 font-display text-lg ${mode === "login" ? "bg-ink text-canvas" : "border border-ink/20"}`}>
            Sign in
          </button>
          <button type="button" onClick={() => { setMode("signup"); setMessage(""); }}
            className={`px-4 py-3 font-display text-lg ${mode === "signup" ? "bg-ink text-canvas" : "border border-ink/20"}`}>
            Create account
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          {mode === "signup" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm">First name<input required value={firstName} onChange={e=>setFirstName(e.target.value)} /></label>
              <label className="text-sm">Last name<input required value={lastName} onChange={e=>setLastName(e.target.value)} /></label>
            </div>
          )}
          <label className="block text-sm">Email<input required type="email" value={email} onChange={e=>setEmail(e.target.value)} /></label>
          <label className="block text-sm">Password<input required minLength={8} type="password" value={password} onChange={e=>setPassword(e.target.value)} /></label>

          {message && <p className="border border-belt/30 bg-belt/5 p-3 text-sm text-ink/75">{message}</p>}

          <button disabled={submitting} className="w-full bg-belt px-6 py-3 font-display text-lg tracking-wide text-card disabled:opacity-50">
            {submitting ? "Please wait…" : mode === "login" ? "Sign in" : "Create instructor account"}
          </button>
        </form>
      </div>

      <p className="mt-6 text-center text-sm text-ink/60">
        Not an instructor? <Link href="/register" className="underline">Go to student registration</Link>
      </p>
    </main>
  );
}
