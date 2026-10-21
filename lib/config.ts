export type Env = Record<string, string | undefined>;

/** Names of the variables in `names` that are empty. Values are never returned. */
export function missingEnv(names: readonly string[], env: Env = process.env): string[] {
  return names.filter((n) => !env[n]?.trim());
}

/** Public URL of the app: APP_URL, or the Vercel production domain when APP_URL is not set. */
export function appUrl(env: Env = process.env): string | null {
  const raw = env.APP_URL?.trim() || (env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${env.VERCEL_PROJECT_PRODUCTION_URL}` : "");
  return raw ? raw.replace(/\/+$/, "") : null;
}

export const GITHUB_CALLBACK_PATH = "/api/auth/github/callback";

export function githubCallbackUrl(env: Env = process.env): string | null {
  const base = appUrl(env);
  return base ? `${base}${GITHUB_CALLBACK_PATH}` : null;
}

/** Everything GitHub sign-in needs, as missing variable names. */
export function missingForSignIn(env: Env = process.env): string[] {
  const missing = missingEnv(["GITHUB_CLIENT_ID", "GITHUB_CLIENT_SECRET", "SESSION_SECRET", "ENCRYPTION_KEY", "DATABASE_URL"], env);
  if (!appUrl(env)) missing.push("APP_URL");
  return missing;
}
