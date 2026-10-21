import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { safeEqual } from "@/lib/crypto";
import { sessionSecret } from "@/lib/auth";
import { createSessionValue, SESSION_COOKIE } from "@/lib/session";
import { saveIntegrationToken } from "@/lib/integrations";
import { githubUser } from "@/lib/tools/github";
import { appUrl, githubCallbackUrl, missingForSignIn } from "@/lib/config";
import { logActivity } from "@/lib/activity";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const expected = req.cookies.get("zido_oauth_state")?.value;
  if (!code || !state || !expected || !safeEqual(state, expected)) {
    return NextResponse.json({ error: "Invalid OAuth state" }, { status: 400 });
  }

  const missing = missingForSignIn();
  const base = appUrl();
  const callback = githubCallbackUrl();
  if (missing.length || !base || !callback) {
    return NextResponse.json({ error: `GitHub sign-in is not configured (${missing.join(", ")})`, missing }, { status: 503 });
  }

  const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { accept: "application/json", "content-type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: callback,
    }),
  });
  const token = (await tokenRes.json()) as { access_token?: string; error_description?: string };
  if (!token.access_token) {
    return NextResponse.json({ error: token.error_description ?? "GitHub did not return a token" }, { status: 400 });
  }

  const gh = await githubUser(token.access_token);
  const user = await prisma.user.upsert({
    where: { githubId: String(gh.id) },
    create: { githubId: String(gh.id), githubLogin: gh.login, name: gh.name ?? gh.login, email: gh.email ?? null, avatarUrl: gh.avatar_url },
    update: { githubLogin: gh.login, name: gh.name ?? gh.login, avatarUrl: gh.avatar_url },
  });
  await saveIntegrationToken(user.id, "github", token.access_token);
  await logActivity(user.id, "signin", `Signed in with GitHub as ${gh.login}`);

  const res = NextResponse.redirect(new URL("/dashboard", base));
  res.cookies.set(SESSION_COOKIE, createSessionValue(user.id, sessionSecret()), {
    httpOnly: true,
    secure: base.startsWith("https"),
    sameSite: "lax",
    maxAge: 30 * 24 * 3600,
    path: "/",
  });
  res.cookies.delete("zido_oauth_state");
  return res;
}
