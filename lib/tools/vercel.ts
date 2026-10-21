const VERCEL_API = "https://api.vercel.com";

/** vercel_deploy: starts a production deployment of a GitHub repository. */
export async function vercelDeploy(
  token: string,
  input: { name: string; repo: string; ref?: string; teamId?: string },
  fetchImpl: typeof fetch = fetch,
): Promise<{ id: string; url: string; readyState: string }> {
  const [org, repo] = input.repo.split("/");
  if (!org || !repo) throw new Error("repo must be owner/name");
  const name = input.name.toLowerCase();
  if (!/^[a-z0-9._-]{1,100}$/.test(name)) throw new Error("Invalid Vercel project name");

  const params = new URLSearchParams({ skipAutoDetectionConfirmation: "1" });
  if (input.teamId) params.set("teamId", input.teamId);

  const res = await fetchImpl(`${VERCEL_API}/v13/deployments?${params.toString()}`, {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify({ name, target: "production", gitSource: { type: "github", org, repo, ref: input.ref ?? "main" } }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Vercel ${res.status}: ${text.slice(0, 300)}`);
  const d = JSON.parse(text) as { id: string; url: string; readyState?: string };
  return { id: d.id, url: `https://${d.url}`, readyState: d.readyState ?? "QUEUED" };
}

export async function vercelWhoAmI(token: string, fetchImpl: typeof fetch = fetch): Promise<string> {
  const res = await fetchImpl(`${VERCEL_API}/v2/user`, { headers: { authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`Vercel token rejected (${res.status})`);
  const d = (await res.json()) as { user?: { username?: string } };
  return d.user?.username ?? "vercel";
}
