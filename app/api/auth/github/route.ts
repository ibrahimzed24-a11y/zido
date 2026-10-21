import { NextResponse } from "next/server";
import { randomToken } from "@/lib/crypto";

export const dynamic = "force-dynamic";

/** Starts GitHub OAuth. The repo scope lets Zido's agents create repositories and commit files. */
export async function GET() {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const appUrl = process.env.APP_URL;
  if (!clientId || !appUrl) {
    return NextResponse.json({ error: "GitHub OAuth is not configured (GITHUB_CLIENT_ID, APP_URL)" }, { status: 503 });
  }
  const state = randomToken(16);
  const url = new URL("https://github.com/login/oauth/authorize");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", `${appUrl}/api/auth/github/callback`);
  url.searchParams.set("scope", "read:user user:email repo");
  url.searchParams.set("state", state);

  const res = NextResponse.redirect(url);
  res.cookies.set("zido_oauth_state", state, {
    httpOnly: true,
    secure: appUrl.startsWith("https"),
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });
  return res;
}
