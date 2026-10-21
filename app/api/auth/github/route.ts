import { NextResponse } from "next/server";
import { randomToken } from "@/lib/crypto";
import { githubCallbackUrl, missingForSignIn } from "@/lib/config";

export const dynamic = "force-dynamic";

/** Starts GitHub OAuth. The repo scope lets Zido's agents create repositories and commit files. */
export async function GET() {
  const missing = missingForSignIn();
  const callback = githubCallbackUrl();
  if (missing.length || !callback) {
    return NextResponse.json({ error: `GitHub sign-in is not configured (${missing.join(", ")})`, missing }, { status: 503 });
  }
  const state = randomToken(16);
  const url = new URL("https://github.com/login/oauth/authorize");
  url.searchParams.set("client_id", process.env.GITHUB_CLIENT_ID as string);
  url.searchParams.set("redirect_uri", callback);
  url.searchParams.set("scope", "read:user user:email repo");
  url.searchParams.set("state", state);

  const res = NextResponse.redirect(url);
  res.cookies.set("zido_oauth_state", state, {
    httpOnly: true,
    secure: callback.startsWith("https"),
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });
  return res;
}
