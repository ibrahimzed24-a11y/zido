"use client";

import { useState } from "react";

export function DeviceKey({ linkedCount }: { linkedCount: number }) {
  const [key, setKey] = useState<string | null>(null);
  const [name, setName] = useState("My Mac");
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setError(null);
    const res = await fetch("/api/zido/device-key", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const data = (await res.json()) as { key?: string; error?: string };
    if (res.ok && data.key) setKey(data.key);
    else setError(data.error ?? "Could not create a key");
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-neutral-400">
        {linkedCount ? `${linkedCount} Mac(s) linked.` : "No Mac linked yet."} Create a key and paste it into the Zido app (Settings → Link this Mac).
      </p>
      <div className="flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-40 rounded-xl border border-white/15 bg-transparent px-3 py-2 text-sm"
          aria-label="Device name"
        />
        <button onClick={generate} className="rounded-xl border border-white/15 px-4 py-2 text-sm hover:bg-white/5">
          Create device key
        </button>
      </div>
      {key && (
        <p className="break-all rounded-xl bg-black/50 p-3 font-mono text-xs">
          {key}
          <span className="mt-2 block font-sans text-neutral-500">Shown once. Only its hash is stored.</span>
        </p>
      )}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
