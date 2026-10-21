import type { Env } from "./config";

export const DEFAULT_OLLAMA_HOST = "https://ollama.com";
export const DEFAULT_OLLAMA_MODEL = "gemma4:31b";

export type OllamaToolCall = { function: { name: string; arguments: Record<string, unknown> | string } };
export type OllamaMessage = {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  images?: string[];
  tool_calls?: OllamaToolCall[];
  tool_name?: string;
  thinking?: string;
};
export type OllamaTool = {
  type: "function";
  function: { name: string; description: string; parameters: Record<string, unknown> };
};
export type OllamaChatResponse = { model: string; message: OllamaMessage; done: boolean; done_reason?: string };
export type OllamaConfig = { host: string; model: string; apiKey?: string };
export type ConfigResult = { ok: true; config: OllamaConfig } | { ok: false; missing: string[] };
export type ChatRequest = { messages: OllamaMessage[]; tools?: OllamaTool[]; temperature?: number; timeoutMs?: number };

function trimHost(host: string): string {
  return host.trim().replace(/\/+$/, "").replace(/\/api$/, "");
}

export function isCloudHost(host: string): boolean {
  try {
    const h = new URL(host).hostname;
    return h === "ollama.com" || h.endsWith(".ollama.com");
  } catch {
    return false;
  }
}

/** The main model. Ollama Cloud (https://ollama.com) by default, which needs OLLAMA_API_KEY; a self-hosted OLLAMA_HOST needs no key. */
export function ollamaConfig(env: Env = process.env): ConfigResult {
  const host = trimHost(env.OLLAMA_HOST?.trim() || DEFAULT_OLLAMA_HOST);
  const model = env.OLLAMA_MODEL?.trim() || DEFAULT_OLLAMA_MODEL;
  const apiKey = env.OLLAMA_API_KEY?.trim() || undefined;
  if (isCloudHost(host) && !apiKey) return { ok: false, missing: ["OLLAMA_API_KEY"] };
  return { ok: true, config: { host, model, apiKey } };
}

/** local_ai_fallback: a self-hosted Ollama server reachable from this server (not the user's laptop). */
export function localOllamaConfig(env: Env = process.env): ConfigResult {
  const raw = env.OLLAMA_LOCAL_HOST?.trim();
  if (!raw) return { ok: false, missing: ["OLLAMA_LOCAL_HOST"] };
  return {
    ok: true,
    config: { host: trimHost(raw), model: env.OLLAMA_LOCAL_MODEL?.trim() || DEFAULT_OLLAMA_MODEL, apiKey: env.OLLAMA_LOCAL_API_KEY?.trim() || undefined },
  };
}

export class OllamaError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = "OllamaError";
    this.status = status;
  }
}

function redact(text: string): string {
  return text.replace(/Bearer\s+\S+/gi, "Bearer [redacted]");
}

/** POST /api/chat, non-streaming. The key is sent only in the Authorization header and never logged. */
export async function ollamaChat(config: OllamaConfig, req: ChatRequest, fetchImpl: typeof fetch = fetch): Promise<OllamaChatResponse> {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (config.apiKey) headers.authorization = `Bearer ${config.apiKey}`;
  const res = await fetchImpl(`${config.host}/api/chat`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: config.model,
      messages: req.messages,
      tools: req.tools,
      stream: false,
      options: { temperature: req.temperature ?? 0.2 },
    }),
    signal: AbortSignal.timeout(req.timeoutMs ?? 55_000),
  });
  const text = await res.text();
  if (!res.ok) throw new OllamaError(`Ollama ${res.status}: ${redact(text).slice(0, 300)}`, res.status);
  let data: OllamaChatResponse;
  try {
    data = JSON.parse(text) as OllamaChatResponse;
  } catch {
    throw new OllamaError("Ollama returned a response that is not JSON");
  }
  if (!data.message) throw new OllamaError("Ollama returned no message");
  data.message.content ??= "";
  return data;
}

/** Tries the main model, then the self-hosted fallback when the main one is missing or fails. */
export async function chatWithFallback(
  primary: ConfigResult,
  local: ConfigResult,
  req: ChatRequest,
  fetchImpl: typeof fetch = fetch,
): Promise<OllamaChatResponse> {
  if (primary.ok) {
    try {
      return await ollamaChat(primary.config, req, fetchImpl);
    } catch (e) {
      if (!local.ok) throw e;
    }
  }
  if (local.ok) return ollamaChat(local.config, req, fetchImpl);
  throw new OllamaError(`Ollama is not configured (${[...(primary.ok ? [] : primary.missing), ...local.missing].join(", ")})`);
}

/** Ollama returns tool arguments as an object; some models send a JSON string instead. */
export function toolCallArgs(call: OllamaToolCall): Record<string, unknown> {
  const a = call.function.arguments;
  if (typeof a === "string") {
    try {
      const parsed: unknown = JSON.parse(a);
      return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : {};
    } catch {
      return {};
    }
  }
  return a ?? {};
}

/** The local_ai_fallback tool: asks the self-hosted model directly. */
export async function localAiFallback(prompt: string, system?: string, env: Env = process.env, fetchImpl: typeof fetch = fetch): Promise<string> {
  const cfg = localOllamaConfig(env);
  if (!cfg.ok) throw new Error(`The local AI fallback is not configured (${cfg.missing.join(", ")})`);
  const messages: OllamaMessage[] = [];
  if (system) messages.push({ role: "system", content: system });
  messages.push({ role: "user", content: prompt });
  const res = await ollamaChat(cfg.config, { messages, timeoutMs: 45_000 }, fetchImpl);
  return res.message.content;
}
