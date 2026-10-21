import { prisma } from "./prisma";
import { getPlan, type PlanId } from "./plans";

/** Talk messages: questions asked in the last 24 hours against the plan's daily limit (null: unlimited). */
export async function talkUsage(userId: string, plan: PlanId): Promise<{ used: number; limit: number | null }> {
  const used = await prisma.message.count({
    where: { role: "user", createdAt: { gte: new Date(Date.now() - 24 * 3600 * 1000) }, conversation: { userId } },
  });
  return { used, limit: getPlan(plan).visionPerDay };
}

/** Agent tool calls this calendar month (UTC) against the plan's monthly limit (null: unlimited). */
export async function agentUsage(userId: string, plan: PlanId, now = new Date()): Promise<{ used: number; limit: number | null }> {
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const used = await prisma.agentTask.count({ where: { userId, createdAt: { gte: start } } });
  return { used, limit: getPlan(plan).agentTasksPerMonth };
}
