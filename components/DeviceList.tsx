import type { Device } from "@prisma/client";
import { deviceState } from "@/lib/devices";
import { timeAgo } from "@/lib/format";

const DOT: Record<string, string> = { online: "bg-emerald-400", offline: "bg-neutral-500", never: "bg-amber-400" };
const LABEL: Record<string, string> = { online: "Connected", offline: "Offline", never: "Waiting for first connection" };

export function DeviceList({ devices }: { devices: Device[] }) {
  if (devices.length === 0) return <p className="text-sm text-neutral-400">No Mac linked. Create a device key in Settings.</p>;
  return (
    <ul className="space-y-3">
      {devices.map((d) => {
        const s = deviceState(d.lastSeenAt);
        return (
          <li key={d.id} className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${DOT[s]}`} />
              {d.name}
            </span>
            <span className="text-neutral-500">
              {LABEL[s]}
              {d.lastSeenAt && s === "offline" ? ` · ${timeAgo(d.lastSeenAt)}` : ""}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
