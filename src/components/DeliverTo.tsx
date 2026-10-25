"use client";

import { useEffect, useState } from "react";

export const PINCODE_KEY = "qc_pincode";

type Zone = { serviceable: boolean; area?: string; eta?: number };

// "📍 Deliver to 609001 · 30 min" strip under the header, like shopping apps show.
export function DeliverTo() {
  const [pincode, setPincode] = useState<string | null>(null);
  const [zone, setZone] = useState<Zone | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  async function check(pin: string) {
    const z: Zone = await fetch(`/api/serviceability?pincode=${pin}`).then((r) => r.json());
    setPincode(pin);
    setZone(z);
    return z;
  }

  useEffect(() => {
    let saved: string | null = null;
    try {
      saved = localStorage.getItem(PINCODE_KEY);
    } catch {}
    // check() only sets state after the fetch resolves.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (saved) check(saved);
  }, []);

  if (editing) {
    return (
      <form
        className="flex items-center gap-2"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!/^\d{6}$/.test(draft)) return;
          await check(draft);
          try {
            localStorage.setItem(PINCODE_KEY, draft);
          } catch {}
          setEditing(false);
        }}
      >
        <span>📍</span>
        <input
          autoFocus
          inputMode="numeric"
          value={draft}
          onChange={(e) => setDraft(e.target.value.replace(/\D/g, "").slice(0, 6))}
          placeholder="Enter pincode"
          className="w-32 rounded border border-white/40 bg-white/90 px-2 py-0.5 text-gray-900 outline-none"
        />
        <button className="font-semibold underline">Apply</button>
        <button type="button" onClick={() => setEditing(false)} className="opacity-80">Cancel</button>
      </form>
    );
  }

  return (
    <button
      onClick={() => {
        setDraft(pincode ?? "");
        setEditing(true);
      }}
      className="flex w-full items-center gap-1.5 text-left"
    >
      <span>📍</span>
      {pincode ? (
        <span>
          Deliver to <b>{pincode}</b>
          {zone && (zone.serviceable ? ` · in ${zone.eta} min` : " · not serviceable")}
        </span>
      ) : (
        <span>Select delivery location</span>
      )}
      <span className="ml-auto opacity-80 sm:ml-1">▾</span>
    </button>
  );
}
