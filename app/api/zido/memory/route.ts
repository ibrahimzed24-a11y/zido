import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { isMemoryName, MEMORY_MAX_CHARS, readMemory, writeMemory } from "@/lib/memory-store";
import { PROFILE_FILE, VOLATILE_FILE } from "@/lib/memory";
import { logActivity } from "@/lib/activity";

export const dynamic = "force-dynamic";

/** The user's PROFILE.md and VOLATILE.md. */
export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const m = await readMemory(user.id);
  return NextResponse.json({ [PROFILE_FILE]: m.profile, [VOLATILE_FILE]: m.volatile });
}

/** Replaces one memory file: { name: "PROFILE.md" | "VOLATILE.md", content }. */
export async function PUT(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const body = (await req.json().catch(() => null)) as { name?: unknown; content?: unknown } | null;
  if (!isMemoryName(body?.name) || typeof body?.content !== "string") {
    return NextResponse.json({ error: `Send { name: "${PROFILE_FILE}" | "${VOLATILE_FILE}", content }` }, { status: 400 });
  }
  if (body.content.length > MEMORY_MAX_CHARS) return NextResponse.json({ error: "content is too long" }, { status: 413 });
  await writeMemory(user.id, body.name, body.content);
  await logActivity(user.id, "memory", `Updated ${body.name}`);
  return NextResponse.json({ ok: true });
}
