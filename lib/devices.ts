import { randomToken } from "./crypto";

export const MAX_DEVICES = 5;
/** The Mac app sends a heartbeat every 60 seconds; two missed beats mean offline. */
export const DEVICE_ONLINE_MS = 2 * 60 * 1000;

export type DeviceState = "online" | "offline" | "never";

export function deviceState(lastSeenAt: Date | null, now = Date.now()): DeviceState {
  if (!lastSeenAt) return "never";
  return now - lastSeenAt.getTime() <= DEVICE_ONLINE_MS ? "online" : "offline";
}

export function newDeviceKey(): string {
  return `zido_${randomToken(32)}`;
}
