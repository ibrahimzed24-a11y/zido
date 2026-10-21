import { prisma } from "./prisma";
import { decryptToken, encryptToken } from "./crypto";

export type Provider = "github" | "vercel";

export async function saveIntegrationToken(userId: string, provider: Provider, token: string): Promise<void> {
  const sealed = encryptToken(token);
  await prisma.integration.upsert({
    where: { userId_provider: { userId, provider } },
    create: { userId, provider, ...sealed },
    update: sealed,
  });
}

export async function getIntegrationToken(userId: string, provider: Provider): Promise<string | null> {
  const row = await prisma.integration.findUnique({ where: { userId_provider: { userId, provider } } });
  return row ? decryptToken(row) : null;
}

export async function connectedProviders(userId: string): Promise<string[]> {
  const rows = await prisma.integration.findMany({ where: { userId }, select: { provider: true } });
  return rows.map((r) => r.provider);
}

export async function removeIntegration(userId: string, provider: Provider): Promise<void> {
  await prisma.integration.deleteMany({ where: { userId, provider } });
}
