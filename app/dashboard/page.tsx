import Link from "next/link";
import { Clock, Zap } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getStats } from "@/lib/stats";
import { formatTimeSaved } from "@/lib/format";
import { StatCard } from "@/components/StatCard";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireUser();
  const [stats, recent] = await Promise.all([
    getStats(user.id),
    prisma.conversation.findMany({ where: { userId: user.id }, orderBy: { updatedAt: "desc" }, take: 5 }),
  ]);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-semibold">Dashboard</h1>
        <p className="text-neutral-400">Welcome back, {user.name ?? "friend"}.</p>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        <StatCard icon={<Zap className="h-4 w-4 text-zido-400" />} label="Agent Tasks Completed" value={String(stats.tasksCompleted)} />
        <StatCard icon={<Clock className="h-4 w-4 text-zido-400" />} label="Time Saved" value={formatTimeSaved(stats.secondsSaved)} />
      </div>

      <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Recent conversations</h2>
          <Link href="/dashboard/conversations" className="text-sm text-zido-400 hover:underline">
            View all
          </Link>
        </div>
        {recent.length === 0 ? (
          <p className="mt-4 text-sm text-neutral-400">No conversations yet. Open the notch on your Mac and say hello.</p>
        ) : (
          <ul className="mt-4 divide-y divide-white/5">
            {recent.map((c) => (
              <li key={c.id} className="flex justify-between py-3 text-sm">
                <span>{c.title}</span>
                <span className="text-neutral-500">{c.updatedAt.toLocaleDateString()}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
