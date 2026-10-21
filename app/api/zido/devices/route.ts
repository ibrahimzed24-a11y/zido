import { NextResponse } from "next/server";
import { currentAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deviceState } from "@/lib/devices";
import { logActivity } from "@/lib/activity";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await currentAuth();
  if (!auth) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const devices = await prisma.device.findMany({ where: { userId: auth.user.id, revokedAt: null }, orderBy: { createdAt: "desc" } });
  return NextResponse.json({
    devices: devices.map((d) => ({
      id: d.id,
      name: d.name,
      appVersion: d.appVersion,
      lastSeenAt: d.lastSeenAt,
      status: deviceState(d.lastSeenAt),
    })),
  });
}

/** Unlinks a Mac: its key stops working immediately. */
export async function DELETE(req: Request) {
  const auth = await currentAuth();
  if (!auth || auth.device) return NextResponse.json({ error: "Sign in on the web to unlink a Mac" }, { status: 401 });
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });
  const res = await prisma.device.updateMany({ where: { id, userId: auth.user.id, revokedAt: null }, data: { revokedAt: new Date() } });
  if (res.count === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await logActivity(auth.user.id, "device", "Unlinked a Mac");
  return NextResponse.json({ ok: true });
}
