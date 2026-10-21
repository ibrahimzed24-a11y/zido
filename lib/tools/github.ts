const GITHUB_API = "https://api.github.com";

async function gh<T>(token: string, path: string, init: RequestInit = {}, fetchImpl: typeof fetch = fetch): Promise<T> {
  const res = await fetchImpl(`${GITHUB_API}${path}`, {
    ...init,
    headers: {
      accept: "application/vnd.github+json",
      "x-github-api-version": "2022-11-28",
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
      ...(init.headers as Record<string, string> | undefined),
    },
  });
  const body = await res.text();
  if (!res.ok) throw new Error(`GitHub ${res.status}: ${body.slice(0, 300)}`);
  return (body ? JSON.parse(body) : {}) as T;
}

export type GitHubUser = { id: number; login: string; name: string | null; email: string | null; avatar_url: string };

export function githubUser(token: string, fetchImpl: typeof fetch = fetch): Promise<GitHubUser> {
  return gh<GitHubUser>(token, "/user", {}, fetchImpl);
}

/** github_create_repo: creates a repository for the signed-in GitHub user. Private by default. */
export async function githubCreateRepo(
  token: string,
  input: { name: string; description?: string; private?: boolean },
  fetchImpl: typeof fetch = fetch,
): Promise<{ full_name: string; url: string; default_branch: string }> {
  if (!/^[A-Za-z0-9._-]{1,100}$/.test(input.name)) throw new Error("Invalid repository name");
  const repo = await gh<{ full_name: string; html_url: string; default_branch: string }>(
    token,
    "/user/repos",
    {
      method: "POST",
      body: JSON.stringify({
        name: input.name,
        description: input.description ?? "",
        private: input.private ?? true,
        auto_init: true,
      }),
    },
    fetchImpl,
  );
  return { full_name: repo.full_name, url: repo.html_url, default_branch: repo.default_branch };
}

/** github_write_file: creates or updates one file and commits it. */
export async function githubWriteFile(
  token: string,
  input: { repo: string; path: string; content: string; message?: string; branch?: string },
  fetchImpl: typeof fetch = fetch,
): Promise<{ url: string; commit: string }> {
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(input.repo)) throw new Error("repo must be owner/name");
  const path = input.path.replace(/^\/+/, "");
  if (!path || path.split("/").some((part) => part === ".." || part === "")) throw new Error("Invalid file path");
  const encodedPath = path.split("/").map(encodeURIComponent).join("/");
  const ref = input.branch ? `?ref=${encodeURIComponent(input.branch)}` : "";

  let sha: string | undefined;
  try {
    sha = (await gh<{ sha: string }>(token, `/repos/${input.repo}/contents/${encodedPath}${ref}`, {}, fetchImpl)).sha;
  } catch (e) {
    if (!(e instanceof Error && e.message.startsWith("GitHub 404"))) throw e;
  }

  const result = await gh<{ content: { html_url: string }; commit: { sha: string } }>(
    token,
    `/repos/${input.repo}/contents/${encodedPath}`,
    {
      method: "PUT",
      body: JSON.stringify({
        message: input.message ?? `Zido: update ${path}`,
        content: Buffer.from(input.content, "utf8").toString("base64"),
        branch: input.branch,
        sha,
      }),
    },
    fetchImpl,
  );
  return { url: result.content.html_url, commit: result.commit.sha };
}
