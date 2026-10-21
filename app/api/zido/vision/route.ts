import { NextResponse } from "next/server";
import { currentAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ollamaChat, ollamaConfig, type OllamaMessage } from "@/lib/ollama";
import { visionSystemPrompt } from "@/lib/prompts";
import { extractGuidance } from "@/lib/rect";
import { extractProfileUpdates } from "@/lib/memory";
import { readMemory, recordTurn } from "@/lib/memory-store";
import { parseVisionRequest } from "@/lib/vision";
import { talkUsage } from "@/lib/usage";
import { getPlan, withinLimit } from "@/lib/plans";
import { logActivity } from "@/lib/activity";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * POST /api/zido/vision: { image: base64 screenshot, question | query, screen? }.
 * Answers with guidance plus normalized rects, each also given in the exact form [RECT: x, y, w, h, label].
 */
export async function POST(req: Request) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "The database is not configured", missing: ["DATABASE_URL"] }, { status: 503 });
  }
  const auth = await currentAuth();
  if (!auth) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const { user } = auth;

  const parsed = parseVisionRequest(await req.json().catch(() => null));
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const input = parsed.value;

  const cfg = ollamaConfig();
  if (!cfg.ok) {
    return NextResponse.json({ error: `Ollama is not configured on the server (${cfg.missing.join(", ")})`, missing: cfg.missing }, { status: 503 });
  }

  const usage = await talkUsage(user.id, user.plan);
  if (!withinLimit(usage.used, usage.limit)) {
    return NextResponse.json(
      { error: `Daily limit of ${usage.limit} messages reached on the ${getPlan(user.plan).name} plan.`, usage },
      { status: 429 },
    );
  }

  const existing = input.conversationId
    ? await prisma.conversation.findFirst({ where: { id: input.conversationId, userId: user.id } })
    : null;
  const conversation = existing ?? (await prisma.conversation.create({ data: { userId: user.id, title: input.question.slice(0, 60) } }));
  const history = await prisma.message.findMany({ where: { conversationId: conversation.id }, orderBy: { createdAt: "desc" }, take: 10 });
  const memory = await readMemory(user.id);

  const messages: OllamaMessage[] = [
    { role: "system", content: visionSystemPrompt({ ...memory, screen: input.screen }) },
    ...history.reverse().map((m): OllamaMessage => ({ role: m.role === "assistant" ? "assistant" : "user", content: m.content })),
    { role: "user", content: input.question, images: [input.image] },
  ];

  let text: string;
  try {
    text = (await ollamaChat(cfg.config, { messages })).message.content;
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Zido could not answer" }, { status: 502 });
  }

  const { clean, facts } = extractProfileUpdates(text);
  const { guidance, rects, rectTags } = extractGuidance(clean, input.screen);
  const t0 = Date.now();
  await prisma.$transaction([
    prisma.message.create({ data: { conversationId: conversation.id, role: "user", content: input.question, createdAt: new Date(t0) } }),
    prisma.message.create({ data: { conversationId: conversation.id, role: "assistant", content: guidance, rects, createdAt: new Date(t0 + 1) } }),
    prisma.conversation.update({ where: { id: conversation.id }, data: { updatedAt: new Date() } }),
  ]);
  await recordTurn(user.id, memory, `Asked: ${input.question}`, facts);
  await logActivity(user.id, "vision", `Answered "${input.question.slice(0, 80)}" with ${rects.length} highlight(s)`);

  return NextResponse.json({
    conversationId: conversation.id,
    guidance,
    reply: guidance,
    rects,
    rectTags,
    actions: [],
    model: cfg.config.model,
    usage: { used: usage.used + 1, limit: usage.limit },
  });
}
