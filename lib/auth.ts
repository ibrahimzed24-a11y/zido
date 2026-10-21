import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "./prisma";
import { sha256 } from "./crypto";
import { readSessionValue, SESSION_COOKIE } from "./session";

export function sessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) throw new Error("SESSION_SECRET must be at least 32 characters");
  return secret;
}

/** The signed-in user, from the session cookie (web) or a device key Bearer token (macOS app). */
export async function currentUser() {
  const jar = await cookies();
  const uid = readSessionValue(jar.get(SESSION_COOKIE)?.value, sessionSecret());
  if (uid) return prisma.user.findUnique({ where: { id: uid } });

  const auth = (await headers()).get("authorization");
  if (auth?.startsWith("Bearer ")) {
    const key = auth.slice(7).trim();
    if (key) return prisma.user.findUnique({ where: { deviceKeyHash: sha256(key) } });
  }
  return null;
}

export async function requireUser() {
  const user = await currentUser();
  if (!user) redirect("/");
  return user;
}
