import type { Prisma } from "@prisma/client";
import type { ToolDef } from "../claude";
import { prisma } from "../prisma";
import { getIntegrationToken } from "../integrations";
import { githubCreateRepo, githubWriteFile } from "./github";
import { vercelDeploy } from "./vercel";

export const AGENT_TOOLS: ToolDef[] = [
  {
    name: "github_create_repo",
    description: "Create a new GitHub repository for the user. Private unless the user asks for public.",
    input_schema: {
      type: "object",
      properties: { name: { type: "string" }, description: { type: "string" }, private: { type: "boolean" } },
      required: ["name"],
    },
  },
  {
    name: "github_write_file",
    description: "Create or update one file in a GitHub repository and commit it.",
    input_schema: {
      type: "object",
      properties: {
        repo: { type: "string", description: "owner/name" },
        path: { type: "string" },
        content: { type: "string" },
        message: { type: "string" },
        branch: { type: "string" },
      },
      required: ["repo", "path", "content"],
    },
  },
  {
    name: "vercel_deploy",
    description: "Deploy a GitHub repository to Vercel production.",
    input_schema: {
      type: "object",
      properties: { name: { type: "string" }, repo: { type: "string", description: "owner/name" }, ref: { type: "string" } },
      required: ["name", "repo"],
    },
  },
];

/** Rough minutes a person would spend doing the same by hand; feeds the "Time Saved" stat. */
export const SECONDS_SAVED: Record<string, number> = {
  github_create_repo: 120,
  github_write_file: 300,
  vercel_deploy: 600,
};

export type ToolResult = { ok: boolean; summary: string };

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
    default:
      throw new Error(`Unknown tool ${name}`);
  }
}

export async function runTool(userId: string, name: string, input: Record<string, unknown>): Promise<ToolResult> {
  const task = await prisma.agentTask.create({
    data: { userId, tool: name, status: "running", input: JSON.parse(JSON.stringify(input)) as Prisma.InputJsonObject },
  });
  try {
    const provider = name === "vercel_deploy" ? "vercel" : "github";
    const token = await getIntegrationToken(userId, provider);
    const summary = await executeTool(name, input, provider === "vercel" ? { vercel: token } : { github: token });
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
