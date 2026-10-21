import { safeEqual, sign } from "./crypto";

export const SESSION_COOKIE = "zido_session";
const THIRTY_DAYS = 30 * 24 * 3600 * 1000;

export function createSessionValue(userId: string, secret: string, now = Date.now(), ttlMs = THIRTY_DAYS): string {
  const payload = Buffer.from(JSON.stringify({ uid: userId, exp: now + ttlMs })).toString("base64url");
  return `${payload}.${sign(payload, secret)}`;
}

export function readSessionValue(value: string | undefined, secret: string, now = Date.now()): string | null {
  if (!value) return null;
  const [payload, mac] = value.split(".");
  if (!payload || !mac || !safeEqual(sign(payload, secret), mac)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { uid?: unknown; exp?: unknown };
    if (typeof data.uid !== "string" || typeof data.exp !== "number" || data.exp < now) return null;
    return data.uid;
  } catch {
    return null;
  }
}
