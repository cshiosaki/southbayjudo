"use client";

import { useState, type FormEvent } from "react";
import RegistrationFlow from "@/components/RegistrationFlow";

export default function TestRegisterPage() {
  const [password, setPassword] = useState("");
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [run, setRun] = useState(0);

  async function verifyTestAccess(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/test-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!response.ok) {
        setError("Incorrect test password or test login unavailable.");
        return;
      }
      setAuthorized(true);
    } catch {
      setError("Could not verify test access. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (!authorized) {
    return (
      <main className="max-w-lg mx-auto px-6 py-20">
        <p className="text-belt uppercase tracking-widest font-display mb-3">Admin only · dry-run environment</p>
        <h1 className="font-display text-4xl mb-4">Test January 2027 registration</h1>
        <p className="text-ink/70 mb-6">
          Enter your separate South Bay Judo test password. This test opens the January
          session early without changing its public registration dates.
        </p>
        <form onSubmit={verifyTestAccess} className="space-y-4">
          <label className="block text-sm">
            <span className="block mb-1">Test registration password</span>
            <input
              autoComplete="off"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>
          {error && <p role="alert" className="text-sm text-belt">{error}</p>}
          <button
            type="submit"
            className="bg-belt text-white px-6 py-3 font-display disabled:opacity-30"
            disabled={loading || !password}
          >
            {loading ? "Verifying..." : "Open test registration"}
          </button>
        </form>
        <p className="text-ink/55 text-xs mt-6">
          No charges, registration receipts, roster rows, or auto-renewals are created. Returning-student verification links are emailed to contacts on file.
        </p>
      </main>
    );
  }

  return (
    <>
      <div className="border-b-4 border-belt bg-ink text-white">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <strong className="font-display text-xl">ADMIN TEST MODE — NOT A REAL REGISTRATION</strong>
          <p className="text-sm mt-1">
            Winter 2027 (1Q) is enabled here only for testing. Forms, student lookup,
            USJF lookup, prices, and checkout calculations are exercised; payment, roster
            writes, payment receipts, and auto-renewal creation are disabled. Email verification links are sent when requested.
          </p>
        </div>
      </div>
      <RegistrationFlow
        key={run}
        testMode
        testPassword={password}
        onRestart={() => setRun((count) => count + 1)}
      />
    </>
  );
}
