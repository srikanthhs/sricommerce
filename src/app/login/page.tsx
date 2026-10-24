"use client";

import { useState } from "react";

export default function LoginPage() {
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function post(url: string, body: object) {
    setBusy(true);
    setError(null);
    const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) setError(data.error ?? "Something went wrong.");
    return res.ok ? data : null;
  }

  return (
    <div className="mx-auto max-w-sm rounded-2xl bg-white p-6 shadow-sm">
      <h1 className="text-xl font-bold">Log in or sign up</h1>
      <p className="mb-4 text-sm text-gray-500">We&apos;ll send a one-time password to your phone.</p>
      {!sent ? (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const data = await post("/api/auth/send-otp", { phone });
            if (data) {
              setSent(true);
              if (data.devCode) setHint(`Dev mode: your OTP is ${data.devCode}`);
            }
          }}
        >
          <div className="flex rounded-lg border border-gray-300">
            <span className="border-r border-gray-300 px-3 py-2 text-sm text-gray-500">+91</span>
            <input
              inputMode="numeric"
              maxLength={10}
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
              placeholder="Mobile number"
              className="flex-1 px-3 py-2 text-sm outline-none"
            />
          </div>
          <button disabled={busy || phone.length !== 10} className="mt-4 w-full rounded-lg bg-green-700 py-2 font-semibold text-white disabled:opacity-50">
            Continue
          </button>
        </form>
      ) : (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (await post("/api/auth/verify", { phone, code })) {
              const next = new URLSearchParams(window.location.search).get("next");
              window.location.href = next && next.startsWith("/") ? next : "/";
            }
          }}
        >
          <p className="mb-2 text-sm">Enter the OTP sent to +91 {phone}</p>
          <input
            inputMode="numeric"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            placeholder="6-digit OTP"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-center text-lg tracking-widest outline-none"
          />
          {hint && <p className="mt-2 text-xs text-amber-700">{hint}</p>}
          <button disabled={busy || code.length !== 6} className="mt-4 w-full rounded-lg bg-green-700 py-2 font-semibold text-white disabled:opacity-50">
            Verify
          </button>
        </form>
      )}
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </div>
  );
}
