import { requireUser } from "@/lib/auth";
import { connectedProviders } from "@/lib/integrations";
import { PROFILE_FILE, VOLATILE_FILE } from "@/lib/memory";
import { Pricing } from "@/components/Pricing";
import { VercelConnect } from "@/components/VercelConnect";
import { DeviceKey } from "@/components/DeviceKey";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await requireUser();
  const connected = await connectedProviders(user.id);

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-semibold">Settings</h1>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6">
          <h2 className="font-semibold">Integrations</h2>
          <div className="flex items-center justify-between text-sm">
            <span>GitHub</span>
            {connected.includes("github") ? (
              <span className="text-emerald-400">Connected via OAuth</span>
            ) : (
              <a href="/api/auth/github" className="text-zido-400 hover:underline">Connect</a>
            )}
          </div>
          <div className="space-y-2 text-sm">
            <span>Vercel</span>
            <VercelConnect connected={connected.includes("vercel")} />
          </div>
          <p className="text-xs text-neutral-500">Tokens are encrypted with AES-256-GCM before they are stored.</p>
        </div>

        <div className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6">
          <h2 className="font-semibold">Your Mac</h2>
          <DeviceKey linked={Boolean(user.deviceKeyHash)} />
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <h2 className="font-mono text-sm">{PROFILE_FILE}</h2>
          <pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap text-xs text-neutral-400">{user.profileMd || "Zido has not learned anything about you yet."}</pre>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <h2 className="font-mono text-sm">{VOLATILE_FILE}</h2>
          <pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap text-xs text-neutral-400">{user.volatileMd || "Empty."}</pre>
        </div>
      </section>

      <div className="-mx-6">
        <Pricing currentPlan={user.plan} />
      </div>

      <form action="/api/auth/logout" method="post">
        <button type="submit" className="text-sm text-neutral-400 hover:text-white">Sign out</button>
      </form>
    </div>
  );
}
