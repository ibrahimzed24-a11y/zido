import { prisma } from "./prisma";
import { appendVolatile, mergeProfile, PROFILE_FILE, VOLATILE_FILE } from "./memory";

export type MemoryName = typeof PROFILE_FILE | typeof VOLATILE_FILE;
export const MEMORY_NAMES: MemoryName[] = [PROFILE_FILE, VOLATILE_FILE];
export const MEMORY_MAX_CHARS = 20_000;

export function isMemoryName(name: unknown): name is MemoryName {
  return name === PROFILE_FILE || name === VOLATILE_FILE;
}

/** PROFILE.md and VOLATILE.md for one user. */
export async function readMemory(userId: string): Promise<{ profile: string; volatile: string }> {
  const rows = await prisma.memoryFile.findMany({ where: { userId } });
  const get = (name: string) => rows.find((r) => r.name === name)?.content ?? "";
  return { profile: get(PROFILE_FILE), volatile: get(VOLATILE_FILE) };
}

export async function writeMemory(userId: string, name: MemoryName, content: string): Promise<void> {
  const value = content.slice(0, MEMORY_MAX_CHARS);
  await prisma.memoryFile.upsert({
    where: { userId_name: { userId, name } },
    create: { userId, name, content: value },
    update: { content: value },
  });
}

/** After each turn: log it in VOLATILE.md and merge any [REMEMBER] facts into PROFILE.md. */
export async function recordTurn(userId: string, current: { profile: string; volatile: string }, entry: string, facts: string[]): Promise<void> {
  const writes = [writeMemory(userId, VOLATILE_FILE, appendVolatile(current.volatile, entry))];
  if (facts.length) writes.push(writeMemory(userId, PROFILE_FILE, mergeProfile(current.profile, facts)));
  await Promise.all(writes);
}
