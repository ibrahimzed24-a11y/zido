import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { connectedProviders, removeIntegration, saveIntegrationToken } from "@/lib/integrations";
import { vercelWhoAmI } from "@/lib/tools/vercel";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  return NextResponse.json({ connected: await connectedProviders(user.id) });
}

/** Saves a Vercel token (GitHub is connected through OAuth). The token is verified, then stored encrypted. */
export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const body = (await req.json().catch(() => null)) as { provider?: unknown; token?: unknown } | null;
  if (body?.provider !== "vercel" || typeof body.token !== "string" || !body.token.trim()) {
    return NextResponse.json({ error: "Send { provider: \"vercel\", token }" }, { status: 400 });
  }
  try {
    const account = await vercelWhoAmI(body.token.trim());
    await saveIntegrationToken(user.id, "vercel", body.token.trim());
    return NextResponse.json({ ok: true, provider: "vercel", account });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Could not save the token" }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const provider = new URL(req.url).searchParams.get("provider");
  if (provider !== "vercel" && provider !== "github") return NextResponse.json({ error: "Unknown provider" }, { status: 400 });
  await removeIntegration(user.id, provider);
  return NextResponse.json({ ok: true });
}
