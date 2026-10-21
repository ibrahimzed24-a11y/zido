import { Github, Rocket } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { connectedProviders } from "@/lib/integrations";
import { canUseAgents } from "@/lib/plans";

export const dynamic = "force-dynamic";

const AGENTS = [
  { name: "GitHub Builder", provider: "github", icon: Github, tools: ["github_create_repo", "github_write_file"] },
  { name: "Vercel Deployer", provider: "vercel", icon: Rocket, tools: ["vercel_deploy"] },
];

export default async function AgentsPage() {
  const user = await requireUser();
  const [connected, tasks] = await Promise.all([
    connectedProviders(user.id),
    prisma.agentTask.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 20 }),
  ]);
  const allowed = canUseAgents(user.plan);

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-semibold">My Agents</h1>
      {!allowed && (
        <p className="rounded-2xl border border-zido-500/40 bg-zido-900/40 p-4 text-sm">
          Agent tasks are part of Pro and Max. Upgrade in Settings to let Zido build and ship for you.
        </p>
      )}
      <div className="grid gap-6 md:grid-cols-2">
        {AGENTS.map(({ name, provider, icon: Icon, tools }) => (
          <div key={name} className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-semibold">
                <Icon className="h-5 w-5 text-zido-400" /> {name}
              </h2>
              <span className={`text-xs ${connected.includes(provider) ? "text-emerald-400" : "text-neutral-500"}`}>
                {connected.includes(provider) ? "Connected" : "Not connected"}
              </span>
            </div>
            <p className="mt-3 font-mono text-xs text-neutral-400">{tools.join(" · ")}</p>
          </div>
        ))}
      </div>

      <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <h2 className="font-semibold">Recent tasks</h2>
        {tasks.length === 0 ? (
          <p className="mt-4 text-sm text-neutral-400">No agent tasks yet.</p>
        ) : (
          <table className="mt-4 w-full text-left text-sm">
            <thead className="text-neutral-500">
              <tr>
                <th className="py-2">Tool</th>
                <th>Status</th>
                <th>Result</th>
                <th>When</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {tasks.map((t) => {
                const out = t.output as { summary?: string; error?: string } | null;
                return (
                  <tr key={t.id}>
                    <td className="py-2 font-mono text-xs">{t.tool}</td>
                    <td>{t.status}</td>
                    <td className="max-w-md truncate text-neutral-400">{out?.summary ?? out?.error ?? ""}</td>
                    <td className="text-neutral-500">{t.createdAt.toLocaleString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
