import type { Prisma } from "@prisma/client";
import type { OllamaTool } from "../ollama";
import { localAiFallback } from "../ollama";
import { prisma } from "../prisma";
import { getIntegrationToken, type Provider } from "../integrations";
import { githubCreateRepo, githubWriteFile } from "./github";
import { vercelDeploy } from "./vercel";

function tool(name: string, description: string, properties: Record<string, unknown>, required: string[]): OllamaTool {
  return { type: "function", function: { name, description, parameters: { type: "object", properties, required } } };
}

/** The only tools the agent may call. Anything else the model asks for is refused. */
export const AGENT_TOOLS: OllamaTool[] = [
  tool(
    "github_create_repo",
    "Create a new GitHub repository for the user. Private unless the user asks for public.",
    { name: { type: "string" }, description: { type: "string" }, private: { type: "boolean" } },
    ["name"],
  ),
  tool(
    "github_write_file",
    "Create or update one file in a GitHub repository and commit it.",
    {
      repo: { type: "string", description: "owner/name" },
      path: { type: "string" },
      content: { type: "string" },
      message: { type: "string" },
      branch: { type: "string" },
    },
    ["repo", "path", "content"],
  ),
  tool(
    "vercel_deploy",
    "Deploy a GitHub repository to Vercel production.",
    { name: { type: "string" }, repo: { type: "string", description: "owner/name" }, ref: { type: "string" } },
    ["name", "repo"],
  ),
  tool(
    "local_ai_fallback",
    "Ask the self-hosted fallback model for a draft or a second opinion, when the user asks for the local model.",
    { prompt: { type: "string" }, system: { type: "string" } },
    ["prompt"],
  ),
];

const PROVIDER: Record<string, Provider | null> = {
  github_create_repo: "github",
  github_write_file: "github",
  vercel_deploy: "vercel",
  local_ai_fallback: null,
};

export function isAgentTool(name: string): boolean {
  return Object.prototype.hasOwnProperty.call(PROVIDER, name);
}

/** Rough seconds a person would spend doing the same by hand; feeds the "Time Saved" stat. */
export const SECONDS_SAVED: Record<string, number> = {
  github_create_repo: 120,
  github_write_file: 300,
  vercel_deploy: 600,
  local_ai_fallback: 60,
};

export type ToolResult = { ok: boolean; summary: string };
export type ToolDeps = { localChat?: (prompt: string, system?: string) => Promise<string> };

function str(v: unknown, field: string): string {
  if (typeof v !== "string" || !v.trim()) throw new Error(`${field} is required`);
  return v;
}

function optional(v: unknown): string | undefined {
  return typeof v === "string" && v.trim() ? v : undefined;
}

export async function executeTool(
  name: string,
  input: Record<string, unknown>,
  tokens: { github?: string | null; vercel?: string | null },
  deps: ToolDeps = {},
): Promise<string> {
  switch (name) {
    case "github_create_repo": {
      if (!tokens.github) throw new Error("GitHub is not connected. Connect it in Settings.");
      const r = await githubCreateRepo(tokens.github, {
        name: str(input.name, "name"),
        description: optional(input.description),
        private: input.private !== false,
      });
      return `Created ${r.full_name} (${r.url})`;
    }
    case "github_write_file": {
      if (!tokens.github) throw new Error("GitHub is not connected. Connect it in Settings.");
      const path = str(input.path, "path");
      const repo = str(input.repo, "repo");
      const r = await githubWriteFile(tokens.github, {
        repo,
        path,
        content: typeof input.content === "string" ? input.content : "",
        message: optional(input.message),
        branch: optional(input.branch),
      });
      return `Committed ${path} to ${repo} (${r.commit.slice(0, 7)})`;
    }
    case "vercel_deploy": {
      if (!tokens.vercel) throw new Error("Vercel is not connected. Add a Vercel token in Settings.");
      const r = await vercelDeploy(tokens.vercel, {
        name: str(input.name, "name"),
        repo: str(input.repo, "repo"),
        ref: optional(input.ref),
      });
      return `Deployment started: ${r.url} (${r.readyState})`;
    }
    case "local_ai_fallback": {
      const prompt = str(input.prompt, "prompt");
      if (prompt.length > 8000) throw new Error("prompt is too long");
      const chat = deps.localChat ?? ((p: string, s?: string) => localAiFallback(p, s));
      const answer = await chat(prompt, optional(input.system));
      return `Local model answered: ${answer.slice(0, 2000)}`;
    }
    default:
      throw new Error(`Unknown tool ${name}`);
  }
}

export async function runTool(userId: string, name: string, input: Record<string, unknown>): Promise<ToolResult> {
  const stored = JSON.parse(
    JSON.stringify({ ...input, ...(typeof input.content === "string" ? { content: input.content.slice(0, 2000) } : {}) }),
  ) as Prisma.InputJsonObject;
  const task = await prisma.agentTask.create({ data: { userId, tool: name, status: "running", input: stored } });
  try {
    const provider = PROVIDER[name] ?? null;
    const token = provider ? await getIntegrationToken(userId, provider) : null;
    const tokens = provider === "vercel" ? { vercel: token } : provider === "github" ? { github: token } : {};
    const summary = await executeTool(name, input, tokens);
    await prisma.agentTask.update({
      where: { id: task.id },
      data: { status: "completed", output: { summary }, secondsSaved: SECONDS_SAVED[name] ?? 0, completedAt: new Date() },
    });
    return { ok: true, summary };
  } catch (e) {
    const summary = e instanceof Error ? e.message : String(e);
    await prisma.agentTask.update({
      where: { id: task.id },
      data: { status: "failed", output: { error: summary }, completedAt: new Date() },
    });
    return { ok: false, summary };
  }
}
