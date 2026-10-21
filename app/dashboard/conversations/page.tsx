import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function ConversationsPage() {
  const user = await requireUser();
  const conversations = await prisma.conversation.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    take: 50,
    include: {
      messages: { where: { role: "assistant" }, orderBy: { createdAt: "desc" }, take: 1 },
      _count: { select: { messages: true } },
    },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold">Conversations</h1>
      {conversations.length === 0 ? (
        <p className="text-neutral-400">Nothing here yet. Everything you ask Zido on your Mac shows up here.</p>
      ) : (
        <ul className="space-y-3">
          {conversations.map((c) => (
            <li key={c.id} className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="flex justify-between gap-4">
                <h2 className="font-medium">{c.title}</h2>
                <span className="shrink-0 text-xs text-neutral-500">
                  {c._count.messages} messages · {c.updatedAt.toLocaleString()}
                </span>
              </div>
              {c.messages[0] && <p className="mt-2 line-clamp-2 text-sm text-neutral-400">{c.messages[0].content}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
