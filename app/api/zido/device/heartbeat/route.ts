import { NextResponse } from "next/server";
import { currentAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";
import { getPlan } from "@/lib/plans";

export const dynamic = "force-dynamic";

/** The Mac app calls this every 60 seconds with its device key; it drives "Connected" on the dashboard. */
export async function POST(req: Request) {
  const auth = await currentAuth();
  if (!auth?.device) return NextResponse.json({ error: "Send the device key as a Bearer token" }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as { appVersion?: unknown };
  const appVersion = typeof body?.appVersion === "string" ? body.appVersion.slice(0, 32) : null;
  const first = !auth.device.appVersion;
  await prisma.device.update({ where: { id: auth.device.id }, data: { lastSeenAt: new Date(), ...(appVersion ? { appVersion } : {}) } });
  if (first) await logActivity(auth.user.id, "device", `${auth.device.name} connected`);
  return NextResponse.json({
    ok: true,
    user: { id: auth.user.id, name: auth.user.name, login: auth.user.githubLogin, plan: auth.user.plan, unlimited: getPlan(auth.user.plan).visionPerDay === null },
    device: { id: auth.device.id, name: auth.device.name },
  });
}
