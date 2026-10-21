import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import type { Device, User } from "@prisma/client";
import { prisma } from "./prisma";
import { sha256 } from "./crypto";
import { readSessionValue, SESSION_COOKIE } from "./session";

export function sessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) throw new Error("SESSION_SECRET must be at least 32 characters");
  return secret;
}

function optionalSessionSecret(): string | null {
  const secret = process.env.SESSION_SECRET;
  return secret && secret.length >= 32 ? secret : null;
}

export type AuthContext = { user: User; device: Device | null };

/** The signed-in user, from the session cookie (web) or a device key Bearer token (macOS app). */
export async function currentAuth(): Promise<AuthContext | null> {
  // Without a database nobody can be signed in; answer 401 rather than failing.
  if (!process.env.DATABASE_URL) return null;
  const secret = optionalSessionSecret();
  if (secret) {
    const uid = readSessionValue((await cookies()).get(SESSION_COOKIE)?.value, secret);
    if (uid) {
      const user = await prisma.user.findUnique({ where: { id: uid } });
      if (user) return { user, device: null };
    }
  }

  const auth = (await headers()).get("authorization");
  if (auth?.startsWith("Bearer ")) {
    const key = auth.slice(7).trim();
    if (key) {
      const found = await prisma.device.findUnique({ where: { keyHash: sha256(key) }, include: { user: true } });
      if (found && !found.revokedAt) {
        const { user, ...device } = found;
        if (!device.lastSeenAt || Date.now() - device.lastSeenAt.getTime() > 30_000) {
          device.lastSeenAt = new Date();
          await prisma.device.update({ where: { id: device.id }, data: { lastSeenAt: device.lastSeenAt } }).catch(() => undefined);
        }
        return { user, device };
      }
    }
  }
  return null;
}

export async function currentUser(): Promise<User | null> {
  return (await currentAuth())?.user ?? null;
}

export async function requireUser(): Promise<User> {
  const user = await currentUser();
  if (!user) redirect("/");
  return user;
}
