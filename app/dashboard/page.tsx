import Link from "next/link";
import { Clock, MessageCircle, Zap } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getStats } from "@/lib/stats";
import { talkUsage } from "@/lib/usage";
import { formatTimeSaved, timeAgo } from "@/lib/format";
import { formatLimit } from "@/lib/plans";
import { StatCard } from "@/components/StatCard";
import { DeviceList } from "@/components/DeviceList";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireUser();
  const [stats, talk, activity, devices] = await Promise.all([
    getStats(user.id),
    talkUsage(user.id, user.plan),
    prisma.activity.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 12 }),
    prisma.device.findMany({ where: { userId: user.id, revokedAt: null }, orderBy: { createdAt: "desc" } }),
  ]);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-semibold">Dashboard</h1>
        <p className="text-neutral-400">Welcome back, {user.name ?? "friend"}.</p>
      </header>

      <div className="grid gap-6 md:grid-cols-3">
        <StatCard icon={<Zap className="h-4 w-4 text-zido-400" />} label="Agent Tasks Completed" value={String(stats.tasksCompleted)} />
        <StatCard icon={<Clock className="h-4 w-4 text-zido-400" />} label="Time Saved" value={formatTimeSaved(stats.secondsSaved)} />
        <StatCard
          icon={<MessageCircle className="h-4 w-4 text-zido-400" />}
          label="Talk Message Limits"
          value={`${talk.used} / ${formatLimit(talk.limit)}`}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <section className="rounded-3xl border border-white/10 bg-white/5 p-6 md:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Activity</h2>
            <Link href="/dashboard/conversations" className="text-sm text-zido-400 hover:underline">
              Conversations
            </Link>
          </div>
          {activity.length === 0 ? (
            <p className="mt-4 text-sm text-neutral-400">Nothing yet. Link your Mac and say hello from the notch.</p>
          ) : (
            <ul className="mt-4 divide-y divide-white/5">
              {activity.map((a) => (
                <li key={a.id} className="flex justify-between gap-4 py-3 text-sm">
                  <span>{a.summary}</span>
                  <span className="shrink-0 text-neutral-500">{timeAgo(a.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <h2 className="mb-4 font-semibold">Devices</h2>
          <DeviceList devices={devices} />
        </section>
      </div>
    </div>
  );
}
