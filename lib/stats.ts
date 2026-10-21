import { prisma } from "./prisma";

export async function getStats(userId: string): Promise<{ tasksCompleted: number; secondsSaved: number }> {
  const where = { userId, status: "completed" };
  const [tasksCompleted, saved] = await Promise.all([
    prisma.agentTask.count({ where }),
    prisma.agentTask.aggregate({ where, _sum: { secondsSaved: true } }),
  ]);
  return { tasksCompleted, secondsSaved: saved._sum.secondsSaved ?? 0 };
}
