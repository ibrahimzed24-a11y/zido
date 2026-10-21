import { NextResponse } from "next/server";
import { currentAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sha256 } from "@/lib/crypto";
import { MAX_DEVICES, newDeviceKey } from "@/lib/devices";
import { logActivity } from "@/lib/activity";

export const dynamic = "force-dynamic";

/** Creates a device key for a Mac. It is shown once; only its sha256 is stored. Web session only. */
export async function POST(req: Request) {
  const auth = await currentAuth();
  if (!auth || auth.device) return NextResponse.json({ error: "Sign in on the web to link a Mac" }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as { name?: unknown };
  const name = typeof body?.name === "string" && body.name.trim() ? body.name.trim().slice(0, 60) : "My Mac";

  const active = await prisma.device.count({ where: { userId: auth.user.id, revokedAt: null } });
  if (active >= MAX_DEVICES) {
    return NextResponse.json({ error: `You already have ${MAX_DEVICES} linked Macs. Unlink one first.` }, { status: 409 });
  }
  const key = newDeviceKey();
  const device = await prisma.device.create({ data: { userId: auth.user.id, name, keyHash: sha256(key) } });
  await logActivity(auth.user.id, "device", `Created a device key for ${name}`);
  return NextResponse.json({ key, device: { id: device.id, name: device.name } });
}
