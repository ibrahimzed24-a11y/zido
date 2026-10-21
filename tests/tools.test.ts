import { describe, expect, it } from "vitest";
import { githubCreateRepo, githubWriteFile } from "@/lib/tools/github";
import { vercelDeploy } from "@/lib/tools/vercel";
import { executeTool } from "@/lib/tools";
import { parseVisionRequest } from "@/lib/vision";

type Call = { url: string; init?: RequestInit };

function fakeFetch(responses: { status: number; body: unknown }[], calls: Call[]): typeof fetch {
  return (async (url: string | URL | Request, init?: RequestInit) => {
    calls.push({ url: String(url), init });
    const next = responses.shift() ?? { status: 500, body: {} };
    return new Response(JSON.stringify(next.body), { status: next.status });
  }) as typeof fetch;
}

describe("agent tools", () => {
  it("github_create_repo creates a private repo", async () => {
    const calls: Call[] = [];
    const f = fakeFetch([{ status: 201, body: { full_name: "me/app", html_url: "https://github.com/me/app", default_branch: "main" } }], calls);
    const r = await githubCreateRepo("tok", { name: "app" }, f);
    expect(r.url).toBe("https://github.com/me/app");
    expect(calls[0].url).toBe("https://api.github.com/user/repos");
    expect(JSON.parse(String(calls[0].init?.body)).private).toBe(true);
    expect((calls[0].init?.headers as Record<string, string>).authorization).toBe("Bearer tok");
  });

  it("github_write_file updates an existing file with its sha", async () => {
    const calls: Call[] = [];
    const f = fakeFetch(
      [
        { status: 200, body: { sha: "abc" } },
        { status: 200, body: { content: { html_url: "https://github.com/me/app/blob/main/a.md" }, commit: { sha: "def1234567" } } },
      ],
      calls,
    );
    const r = await githubWriteFile("tok", { repo: "me/app", path: "docs/a.md", content: "hello" }, f);
    expect(r.commit).toBe("def1234567");
    const put = JSON.parse(String(calls[1].init?.body));
    expect(put.sha).toBe("abc");
    expect(Buffer.from(put.content, "base64").toString()).toBe("hello");
  });

  it("github_write_file creates a new file after a 404", async () => {
    const calls: Call[] = [];
    const f = fakeFetch(
      [
        { status: 404, body: { message: "Not Found" } },
        { status: 201, body: { content: { html_url: "u" }, commit: { sha: "1" } } },
      ],
      calls,
    );
    await githubWriteFile("tok", { repo: "me/app", path: "new.txt", content: "x" }, f);
    expect(JSON.parse(String(calls[1].init?.body)).sha).toBeUndefined();
  });

  it("refuses path traversal", async () => {
    await expect(githubWriteFile("tok", { repo: "me/app", path: "../x", content: "" }, fakeFetch([], []))).rejects.toThrow();
  });

  it("vercel_deploy deploys from GitHub", async () => {
    const calls: Call[] = [];
    const f = fakeFetch([{ status: 200, body: { id: "dpl_1", url: "app-abc.vercel.app", readyState: "QUEUED" } }], calls);
    const r = await vercelDeploy("vtok", { name: "App", repo: "me/app" }, f);
    expect(r.url).toBe("https://app-abc.vercel.app");
    const body = JSON.parse(String(calls[0].init?.body));
    expect(body.name).toBe("app");
    expect(body.gitSource).toEqual({ type: "github", org: "me", repo: "app", ref: "main" });
  });

  it("stops when an integration is missing", async () => {
    await expect(executeTool("vercel_deploy", { name: "a", repo: "me/a" }, {})).rejects.toThrow(/Vercel is not connected/);
    await expect(executeTool("github_create_repo", { name: "a" }, { github: null })).rejects.toThrow(/GitHub is not connected/);
  });
});

describe("/api/zido/vision input", () => {
  it("validates the request", () => {
    expect(parseVisionRequest(null).ok).toBe(false);
    expect(parseVisionRequest({ image: "", question: "hi" }).ok).toBe(false);
    const ok = parseVisionRequest({ image: "data:image/png;base64,iVBORw0KGgo=", question: " hi ", screen: { width: 10, height: 20 } });
    expect(ok.ok && ok.value.image).toBe("iVBORw0KGgo=");
    expect(ok.ok && ok.value.question).toBe("hi");
    expect(ok.ok && ok.value.allowAgents).toBe(true);
  });
});
