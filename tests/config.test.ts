import { describe, expect, it } from "vitest";
import { appUrl, githubCallbackUrl, missingEnv, missingForSignIn } from "@/lib/config";
import { deviceState } from "@/lib/devices";
import { AGENT_TOOLS, executeTool, isAgentTool } from "@/lib/tools";

describe("config", () => {
  it("builds the GitHub callback from APP_URL", () => {
    expect(githubCallbackUrl({ APP_URL: "https://zido-gamma.vercel.app/" })).toBe("https://zido-gamma.vercel.app/api/auth/github/callback");
    expect(appUrl({ VERCEL_PROJECT_PRODUCTION_URL: "zido-gamma.vercel.app" })).toBe("https://zido-gamma.vercel.app");
  });
  it("lists missing variable names only", () => {
    expect(missingEnv(["A", "B"], { A: "x", B: " " })).toEqual(["B"]);
    expect(missingForSignIn({})).toContain("APP_URL");
  });
});

describe("devices", () => {
  it("is online for two minutes after a heartbeat", () => {
    const now = Date.now();
    expect(deviceState(null, now)).toBe("never");
    expect(deviceState(new Date(now - 60_000), now)).toBe("online");
    expect(deviceState(new Date(now - 10 * 60_000), now)).toBe("offline");
  });
});

describe("agent tools", () => {
  it("allows exactly the four tools", () => {
    expect(AGENT_TOOLS.map((t) => t.function.name).sort()).toEqual(["github_create_repo", "github_write_file", "local_ai_fallback", "vercel_deploy"]);
    expect(isAgentTool("shell_exec")).toBe(false);
  });
  it("local_ai_fallback uses the injected client and rejects unknown tools", async () => {
    await expect(executeTool("local_ai_fallback", { prompt: "hi" }, {}, { localChat: async () => "hello" })).resolves.toContain("hello");
    await expect(executeTool("rm_rf", {}, {})).rejects.toThrow("Unknown tool");
  });
});
