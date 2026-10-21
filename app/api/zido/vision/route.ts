import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildSystemPrompt, callClaude, type ClaudeMessage, type ContentBlock } from "@/lib/claude";
import { AGENT_TOOLS, runTool } from "@/lib/tools";
import { parseRects } from "@/lib/rect";
import { appendVolatile, extractProfileUpdates, mergeProfile } from "@/lib/memory";
import { canUseAgents, getPlan } from "@/lib/plans";
import { parseVisionRequest } from "@/lib/vision";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_TOOL_ROUNDS = 5;

type TextBlock = Extract<ContentBlock, { type: "text" }>;
type ToolUseBlock = Extract<ContentBlock, { type: "tool_use" }>;

/** POST /api/zido/vision: a screenshot + a question from the macOS app, answered by Claude with [RECT] highlights and optional agent actions. */
export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const parsed = parseVisionRequest(await req.json().catch(() => null));
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const input = parsed.value;

  const plan = getPlan(user.plan);
  const used = await prisma.message.count({
    where: { role: "user", createdAt: { gte: new Date(Date.now() - 24 * 3600 * 1000) }, conversation: { userId: user.id } },
  });
  if (used >= plan.visionPerDay) {
    return NextResponse.json({ error: `Daily limit of ${plan.visionPerDay} questions reached on the ${plan.name} plan.` }, { status: 429 });
  }

  const existing = input.conversationId
    ? await prisma.conversation.findFirst({ where: { id: input.conversationId, userId: user.id } })
    : null;
  const conversation = existing ?? (await prisma.conversation.create({ data: { userId: user.id, title: input.question.slice(0, 60) } }));

  const history = await prisma.message.findMany({
    where: { conversationId: conversation.id },
    orderBy: { createdAt: "desc" },
    take: 10,
  });
  const messages: ClaudeMessage[] = history
    .reverse()
    .map((m): ClaudeMessage => ({ role: m.role === "assistant" ? "assistant" : "user", content: m.content }));
  messages.push({
    role: "user",
    content: [
      { type: "image", source: { type: "base64", media_type: input.mediaType, data: input.image } },
      { type: "text", text: input.question },
    ],
  });

  const agentsAllowed = input.allowAgents && canUseAgents(user.plan);
  const system = buildSystemPrompt({ profile: user.profileMd, volatile: user.volatileMd, screen: input.screen, agentsAllowed });
  const actions: { tool: string; ok: boolean; summary: string }[] = [];
  let finalText = "";

  try {
    for (let round = 0; round <= MAX_TOOL_ROUNDS; round++) {
      const res = await callClaude({ system, messages, tools: agentsAllowed ? AGENT_TOOLS : undefined, maxTokens: 1500 });
      finalText = res.content
        .filter((b): b is TextBlock => b.type === "text")
        .map((b) => b.text)
        .join("\n");
      const uses = res.content.filter((b): b is ToolUseBlock => b.type === "tool_use");
      if (res.stop_reason !== "tool_use" || uses.length === 0 || round === MAX_TOOL_ROUNDS) break;

      messages.push({ role: "assistant", content: res.content });
      const results: ContentBlock[] = [];
      for (const use of uses) {
        const r = await runTool(user.id, use.name, use.input);
        actions.push({ tool: use.name, ok: r.ok, summary: r.summary });
        results.push({ type: "tool_result", tool_use_id: use.id, content: r.summary, is_error: !r.ok });
      }
      messages.push({ role: "user", content: results });
    }
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Zido could not answer" }, { status: 502 });
  }

  const { clean: withoutRects, rects } = parseRects(finalText);
  const { clean: reply, facts } = extractProfileUpdates(withoutRects);
  const t0 = Date.now();

  await prisma.$transaction([
    prisma.message.create({ data: { conversationId: conversation.id, role: "user", content: input.question, createdAt: new Date(t0) } }),
    prisma.message.create({ data: { conversationId: conversation.id, role: "assistant", content: reply, rects, createdAt: new Date(t0 + 1) } }),
    prisma.user.update({
      where: { id: user.id },
      data: {
        profileMd: facts.length ? mergeProfile(user.profileMd, facts) : user.profileMd,
        volatileMd: appendVolatile(user.volatileMd, `Asked: ${input.question}`),
      },
    }),
    prisma.conversation.update({ where: { id: conversation.id }, data: { updatedAt: new Date() } }),
  ]);

  return NextResponse.json({ conversationId: conversation.id, reply, rects, actions });
}
