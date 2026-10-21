import { buildMemoryContext } from "./memory";

/** Claude 3.5 Sonnet by default; override with ZIDO_MODEL. */
export const ZIDO_MODEL = process.env.ZIDO_MODEL || "claude-3-5-sonnet-20241022";

export type ContentBlock =
  | { type: "text"; text: string }
  | { type: "image"; source: { type: "base64"; media_type: "image/png" | "image/jpeg"; data: string } }
  | { type: "tool_use"; id: string; name: string; input: Record<string, unknown> }
  | { type: "tool_result"; tool_use_id: string; content: string; is_error?: boolean };

export type ClaudeMessage = { role: "user" | "assistant"; content: string | ContentBlock[] };
export type ToolDef = { name: string; description: string; input_schema: Record<string, unknown> };
export type ClaudeResponse = {
  id: string;
  content: ContentBlock[];
  stop_reason: string;
  usage?: { input_tokens: number; output_tokens: number };
};

export function buildSystemPrompt(o: {
  profile: string;
  volatile: string;
  screen?: { width: number; height: number };
  agentsAllowed: boolean;
}): string {
  return [
    "You are Zido, the user's AI best friend. You live in the Mac notch, see a screenshot of their screen and help in a warm, concise way.",
    "To point at something on screen, put a tag on its own line: [RECT: x, y, w, h, label] using pixel coordinates of the screenshot (origin top-left). Use at most 5 tags.",
    o.screen ? `The screenshot is ${o.screen.width}x${o.screen.height} pixels.` : "",
    "If you learn a lasting fact about the user (name, role, preferences), add [REMEMBER: fact] on its own line.",
    o.agentsAllowed
      ? "You can act for the user with the tools github_create_repo, github_write_file and vercel_deploy. Only act when the user clearly asks. New repositories are private unless the user says otherwise."
      : "Agent tools are not available on this plan. Explain what you would do and mention that Pro unlocks agent tasks.",
    "Never repeat tokens, API keys or passwords, even if they are visible on screen.",
    buildMemoryContext(o.profile, o.volatile),
  ]
    .filter(Boolean)
    .join("\n\n");
}

export async function callClaude(
  opts: { system: string; messages: ClaudeMessage[]; tools?: ToolDef[]; maxTokens?: number },
  fetchImpl: typeof fetch = fetch,
): Promise<ClaudeResponse> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY is not set");
  const res = await fetchImpl("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({
      model: ZIDO_MODEL,
      max_tokens: opts.maxTokens ?? 1024,
      system: opts.system,
      messages: opts.messages,
      tools: opts.tools,
    }),
  });
  if (!res.ok) throw new Error(`Claude API ${res.status}: ${(await res.text()).slice(0, 300)}`);
  return (await res.json()) as ClaudeResponse;
}
