import { describe, expect, it } from "vitest";
import { appendVolatile, buildMemoryContext, extractProfileUpdates, mergeProfile, VOLATILE_MAX_LINES } from "@/lib/memory";

describe("PROFILE.md and VOLATILE.md", () => {
  it("extracts [REMEMBER] facts", () => {
    const { clean, facts } = extractProfileUpdates("Nice to meet you!\n[REMEMBER: Name is Ibrahim]\n[REMEMBER: Uses Next.js]");
    expect(facts).toEqual(["Name is Ibrahim", "Uses Next.js"]);
    expect(clean).toBe("Nice to meet you!");
  });

  it("merges facts without duplicates", () => {
    const once = mergeProfile("", ["Likes dark mode"]);
    const twice = mergeProfile(once, ["likes dark mode", "Works in Cairo"]);
    expect(twice).toBe("# PROFILE.md\n\n- Likes dark mode\n- Works in Cairo\n");
  });

  it("caps VOLATILE.md", () => {
    let v = "";
    for (let i = 0; i < VOLATILE_MAX_LINES + 10; i++) v = appendVolatile(v, `entry ${i}`, new Date(0));
    const lines = v.split("\n").filter((l) => l.startsWith("- "));
    expect(lines).toHaveLength(VOLATILE_MAX_LINES);
    expect(lines.at(-1)).toContain(`entry ${VOLATILE_MAX_LINES + 9}`);
    expect(v.startsWith("# VOLATILE.md")).toBe(true);
  });

  it("wraps both files for the prompt", () => {
    expect(buildMemoryContext("", "")).toContain("<PROFILE.md>\n(empty)");
  });
});
