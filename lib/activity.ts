import type { Prisma } from "@prisma/client";
import { prisma } from "./prisma";

export type ActivityKind = "signin" | "vision" | "agent" | "device" | "billing" | "integration" | "memory";

/** Adds a line to the dashboard activity feed. Never throws: the feed must not break the request. */
export async function logActivity(userId: string, kind: ActivityKind, summary: string, meta?: Prisma.InputJsonObject): Promise<void> {
  try {
    await prisma.activity.create({ data: { userId, kind, summary: summary.slice(0, 280), meta } });
  } catch (e) {
    console.error("activity: could not log", e instanceof Error ? e.message : e);
  }
}
