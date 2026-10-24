"use client";

import { useRef, useState } from "react";
import type { ConfirmationResult } from "firebase/auth";
import { firebaseConfig, firebaseEnabled } from "@/lib/firebase";

async function postJson(url: string, body: object) {
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "Something went wrong.");
  return data;
}

async function firebaseAuth() {
  const { initializeApp, getApps } = await import("firebase/app");
  const auth = await import("firebase/auth");
  const app = getApps()[0] ?? initializeApp(firebaseConfig);
  return { auth, instance: auth.getAuth(app) };
}

export default function LoginPage() {
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const confirmation = useRef<ConfirmationResult | null>(null);
  const recaptchaBox = useRef<HTMLDivElement>(null);

  async function sendCode() {
    if (firebaseEnabled()) {
      const { auth, instance } = await firebaseAuth();
      const verifier = new auth.RecaptchaVerifier(instance, recaptchaBox.current!, { size: "invisible" });
      try {
        confirmation.current = await auth.signInWithPhoneNumber(instance, `+91${phone}`, verifier);
      } finally {
        verifier.clear();
      }
    } else {
      const data = await postJson("/api/auth/send-otp", { phone });
      if (data.devCode) setHint(`Demo mode: your OTP is ${data.devCode}`);
    }
  }

  async function verifyCode() {
    if (firebaseEnabled()) {
      const cred = await confirmation.current!.confirm(code);
      await postJson("/api/auth/firebase", { idToken: await cred.user.getIdToken() });
    } else {
      await postJson("/api/auth/verify", { phone, code });
    }
  }

  async function attempt(fn: () => Promise<void>, onDone: () => void) {
    setBusy(true);
    setError(null);
    try {
      await fn();
      onDone();
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm rounded-2xl bg-white p-6 shadow-sm">
      <h1 className="text-xl font-bold">Log in or sign up</h1>
      <p className="mb-4 text-sm text-gray-500">We&apos;ll send a one-time password to your phone.</p>
      {!sent ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            attempt(sendCode, () => setSent(true));
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
          onSubmit={(e) => {
            e.preventDefault();
            attempt(verifyCode, () => {
              const next = new URLSearchParams(window.location.search).get("next");
              window.location.href = next && next.startsWith("/") ? next : "/";
            });
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
      <div ref={recaptchaBox} />
    </div>
  );
}

function friendlyError(err: unknown): string {
  const code = (err as { code?: string }).code;
  if (code === "auth/invalid-verification-code") return "Incorrect OTP.";
  if (code === "auth/code-expired") return "OTP expired. Please request a new one.";
  if (code === "auth/too-many-requests") return "Too many attempts. Please try again later.";
  if (code === "auth/invalid-phone-number") return "Enter a valid 10-digit mobile number.";
  return err instanceof Error ? err.message : "Something went wrong.";
}
