import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { randomToken, sha256 } from "@/lib/crypto";

export const dynamic = "force-dynamic";

/** Creates the key the macOS app sends as "Authorization: Bearer". Only its hash is stored. */
export async function POST() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const key = `zido_${randomToken(32)}`;
  await prisma.user.update({ where: { id: user.id }, data: { deviceKeyHash: sha256(key) } });
  return NextResponse.json({ key });
}
