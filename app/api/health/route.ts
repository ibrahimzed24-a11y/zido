import { NextResponse } from "next/server";
import { appUrl, githubCallbackUrl, missingEnv } from "@/lib/config";
import { localOllamaConfig, ollamaConfig } from "@/lib/ollama";

export const dynamic = "force-dynamic";

/** Configuration check. Lists the names of missing environment variables, never their values. */
export async function GET() {
  const ollama = ollamaConfig();
  const missing = {
    database: missingEnv(["DATABASE_URL"]),
    session: [...missingEnv(["SESSION_SECRET", "ENCRYPTION_KEY"]), ...(appUrl() ? [] : ["APP_URL"])],
    github: missingEnv(["GITHUB_CLIENT_ID", "GITHUB_CLIENT_SECRET"]),
    ollama: ollama.ok ? [] : ollama.missing,
    stripe: missingEnv(["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET", "STRIPE_PRICE_PRO", "STRIPE_PRICE_MAX"]),
  };
  return NextResponse.json({
    ok: Object.values(missing).every((m) => m.length === 0),
    appUrl: appUrl(),
    githubCallback: githubCallbackUrl(),
    model: ollama.ok ? ollama.config.model : null,
    localFallback: localOllamaConfig().ok,
    missing,
  });
}
