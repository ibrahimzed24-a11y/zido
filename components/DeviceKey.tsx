"use client";

import { useState } from "react";

export function DeviceKey({ linked }: { linked: boolean }) {
  const [key, setKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setError(null);
    const res = await fetch("/api/zido/device-key", { method: "POST" });
    const data = (await res.json()) as { key?: string; error?: string };
    if (res.ok && data.key) setKey(data.key);
    else setError(data.error ?? "Could not create a key");
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-neutral-400">
        {linked ? "A Mac is linked. Creating a new key unlinks the old one." : "Create a key and paste it into the Zido app's settings."}
      </p>
      <button onClick={generate} className="rounded-xl border border-white/15 px-4 py-2 text-sm hover:bg-white/5">
        {linked ? "Create a new device key" : "Create device key"}
      </button>
      {key && (
        <p className="break-all rounded-xl bg-black/50 p-3 font-mono text-xs">
          {key}
          <span className="mt-2 block font-sans text-neutral-500">Shown once. It is stored only as a hash.</span>
        </p>
      )}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
