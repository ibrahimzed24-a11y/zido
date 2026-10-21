import type { ReactNode } from "react";

export function StatCard({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
      <div className="flex items-center gap-2 text-sm text-neutral-400">
        {icon} {label}
      </div>
      <p className="mt-4 text-4xl font-semibold">{value}</p>
    </div>
  );
}
