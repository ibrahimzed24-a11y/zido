import { describe, expect, it, vi } from "vitest";
import { chatWithFallback, localOllamaConfig, ollamaChat, ollamaConfig, toolCallArgs } from "@/lib/ollama";

describe("ollamaConfig", () => {
  it("defaults to Ollama Cloud and gemma4:31b, and reports the missing key by name", () => {
    expect(ollamaConfig({})).toEqual({ ok: false, missing: ["OLLAMA_API_KEY"] });
    const r = ollamaConfig({ OLLAMA_API_KEY: "k" });
    expect(r.ok && r.config).toEqual({ host: "https://ollama.com", model: "gemma4:31b", apiKey: "k" });
  });
  it("needs no key for a self-hosted server and trims /api", () => {
    const r = ollamaConfig({ OLLAMA_HOST: "http://10.0.0.5:11434/api/" });
    expect(r.ok && r.config.host).toBe("http://10.0.0.5:11434");
  });
  it("local fallback is off until OLLAMA_LOCAL_HOST is set", () => {
    expect(localOllamaConfig({})).toEqual({ ok: false, missing: ["OLLAMA_LOCAL_HOST"] });
  });
});

describe("ollamaChat", () => {
  it("sends images and the bearer key, never echoes the key in errors", async () => {
    const fetchImpl = vi.fn(async (_url: string, init: RequestInit) => {
      const body = JSON.parse(String(init.body));
      expect(body.model).toBe("gemma4:31b");
      expect(body.stream).toBe(false);
      expect(body.messages[0].images).toEqual(["AAAA"]);
      expect((init.headers as Record<string, string>).authorization).toBe("Bearer secret-key");
      return new Response("bad Bearer secret-key", { status: 401 });
    });
    const cfg = { host: "https://ollama.com", model: "gemma4:31b", apiKey: "secret-key" };
    const err = await ollamaChat(cfg, { messages: [{ role: "user", content: "hi", images: ["AAAA"] }] }, fetchImpl as unknown as typeof fetch).catch(
      (e: Error) => e,
    );
    expect(String(err)).not.toContain("secret-key");
  });
  it("falls back to the local server when the main one fails", async () => {
    const fetchImpl = vi.fn(async (url: string) =>
      url.startsWith("https://ollama.com")
        ? new Response("down", { status: 503 })
        : Response.json({ model: "gemma4:31b", done: true, message: { role: "assistant", content: "local" } }),
    );
    const res = await chatWithFallback(
      { ok: true, config: { host: "https://ollama.com", model: "gemma4:31b", apiKey: "k" } },
      { ok: true, config: { host: "http://box:11434", model: "gemma4:31b" } },
      { messages: [{ role: "user", content: "hi" }] },
      fetchImpl as unknown as typeof fetch,
    );
    expect(res.message.content).toBe("local");
  });
});

describe("toolCallArgs", () => {
  it("accepts objects and JSON strings", () => {
    expect(toolCallArgs({ function: { name: "x", arguments: { a: 1 } } })).toEqual({ a: 1 });
    expect(toolCallArgs({ function: { name: "x", arguments: '{"a":2}' } })).toEqual({ a: 2 });
    expect(toolCallArgs({ function: { name: "x", arguments: "nope" } })).toEqual({});
  });
});
