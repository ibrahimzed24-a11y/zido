import { NextResponse } from "next/server";
import { currentAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { chatWithFallback, localOllamaConfig, ollamaConfig, toolCallArgs, type OllamaMessage } from "@/lib/ollama";
import { agentSystemPrompt } from "@/lib/prompts";
import { AGENT_TOOLS, isAgentTool, runTool } from "@/lib/tools";
import { readMemory, recordTurn } from "@/lib/memory-store";
import { canUseAgents } from "@/lib/plans";
import { agentUsage } from "@/lib/usage";
import { logActivity } from "@/lib/activity";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_ROUNDS = 4;
const MAX_CALLS_PER_REQUEST = 6;

/**
 * POST /api/zido/agent: { task, conversationId? }.
 * Controlled tool use: Pro/Max only, a monthly quota, an allow-list of four tools, validated arguments,
 * at most MAX_CALLS_PER_REQUEST calls and MAX_ROUNDS model turns, and every call logged as an AgentTask.
 */
export async function POST(req: Request) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "The database is not configured", missing: ["DATABASE_URL"] }, { status: 503 });
  }
  const auth = await currentAuth();
  if (!auth) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const { user } = auth;

  const body = (await req.json().catch(() => null)) as { task?: unknown; query?: unknown; conversationId?: unknown } | null;
  const raw = typeof body?.task === "string" ? body.task : typeof body?.query === "string" ? body.query : "";
  const task = raw.trim();
  if (!task) return NextResponse.json({ error: "task is required" }, { status: 400 });
  if (task.length > 4000) return NextResponse.json({ error: "task is too long" }, { status: 400 });

  if (!canUseAgents(user.plan)) {
    return NextResponse.json({ error: "Agent tasks are part of Pro and Max." }, { status: 403 });
  }
  const quota = await agentUsage(user.id, user.plan);
  if (quota.used >= quota.limit) {
    return NextResponse.json({ error: "Monthly agent task limit reached.", usage: quota }, { status: 429 });
  }

  const primary = ollamaConfig();
  const local = localOllamaConfig();
  if (!primary.ok && !local.ok) {
    return NextResponse.json(
      { error: `Ollama is not configured on the server (${primary.missing.join(", ")})`, missing: primary.missing },
      { status: 503 },
    );
  }

  const existing =
    typeof body?.conversationId === "string"
      ? await prisma.conversation.findFirst({ where: { id: body.conversationId, userId: user.id } })
      : null;
  const conversation = existing ?? (await prisma.conversation.create({ data: { userId: user.id, title: task.slice(0, 60) } }));
  const memory = await readMemory(user.id);
  const messages: OllamaMessage[] = [
    { role: "system", content: agentSystemPrompt(memory) },
    { role: "user", content: task },
  ];

  const actions: { tool: string; ok: boolean; summary: string }[] = [];
  let budget = Math.min(MAX_CALLS_PER_REQUEST, quota.limit - quota.used);
  let reply = "";
  let model = "";

  try {
    for (let round = 0; round < MAX_ROUNDS; round++) {
      const res = await chatWithFallback(primary, local, { messages, tools: round < MAX_ROUNDS - 1 ? AGENT_TOOLS : undefined });
      model = res.model;
      reply = res.message.content;
      const calls = res.message.tool_calls ?? [];
      if (calls.length === 0) break;

      messages.push({ role: "assistant", content: res.message.content, tool_calls: calls });
      for (const call of calls) {
        const name = call.function.name;
        let result: { ok: boolean; summary: string };
        if (!isAgentTool(name)) result = { ok: false, summary: `Tool ${name} is not allowed` };
        else if (budget <= 0) result = { ok: false, summary: "Tool call limit reached for this request" };
        else {
          budget--;
          result = await runTool(user.id, name, toolCallArgs(call));
        }
        actions.push({ tool: name, ...result });
        messages.push({ role: "tool", tool_name: name, content: result.summary });
      }
    }
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Zido could not finish the task", actions }, { status: 502 });
  }

  if (!reply.trim()) reply = actions.length ? "Here is what I did." : "I could not work out what to do. Tell me a bit more.";
  const t0 = Date.now();
  await prisma.$transaction([
    prisma.message.create({ data: { conversationId: conversation.id, role: "user", content: task, createdAt: new Date(t0) } }),
    prisma.message.create({ data: { conversationId: conversation.id, role: "assistant", content: reply, createdAt: new Date(t0 + 1) } }),
    prisma.conversation.update({ where: { id: conversation.id }, data: { updatedAt: new Date() } }),
  ]);
  await recordTurn(user.id, memory, `Agent task: ${task}`, []);
  const done = actions.filter((a) => a.ok).length;
  await logActivity(user.id, "agent", `Agent ran ${actions.length} tool call(s), ${done} succeeded: ${task.slice(0, 80)}`);

  return NextResponse.json({ conversationId: conversation.id, reply, actions, model });
}
