"use client";

import { useState, type FormEvent } from "react";

export function VercelConnect({ connected }: { connected: boolean }) {
  const [token, setToken] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  async function save(e: FormEvent) {
    e.preventDefault();
    setStatus("Checking…");
    const res = await fetch("/api/integrations", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ provider: "vercel", token }),
    });
    const data = (await res.json()) as { error?: string; account?: string };
    setToken("");
    setStatus(res.ok ? `Connected as ${data.account}` : (data.error ?? "Could not save the token"));
  }

  return (
    <form onSubmit={save} className="space-y-2">
      <div className="flex gap-2">
        <input
          type="password"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder={connected ? "Connected. Paste a new token to replace it" : "Vercel access token"}
          className="flex-1 rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none focus:border-zido-500"
          autoComplete="off"
        />
        <button type="submit" disabled={!token} className="rounded-xl bg-zido-500 px-4 py-2 text-sm font-medium disabled:opacity-40">
          Save
        </button>
      </div>
      {status && <p className="text-xs text-neutral-400">{status}</p>}
    </form>
  );
}
