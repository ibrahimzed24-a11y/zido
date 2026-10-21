import { describe, expect, it } from "vitest";
import { extractGuidance, formatRect, normalizeRect } from "@/lib/rect";

describe("normalized rects", () => {
  it("keeps 0-1 fractions and returns the exact tag form", () => {
    const g = extractGuidance("Click Deploy.\n[RECT: 0.42, 0.08, 0.1, 0.04, Deploy button]");
    expect(g.guidance).toBe("Click Deploy.");
    expect(g.rects).toEqual([{ x: 0.42, y: 0.08, w: 0.1, h: 0.04, label: "Deploy button" }]);
    expect(g.rectTags).toEqual(["[RECT: 0.42, 0.08, 0.1, 0.04, Deploy button]"]);
  });
  it("divides a 0-1000 grid answer by 1000", () => {
    expect(normalizeRect({ x: 500, y: 250, w: 100, h: 50, label: "x" })).toEqual({ x: 0.5, y: 0.25, w: 0.1, h: 0.05, label: "x" });
  });
  it("divides pixel answers by the screenshot size", () => {
    expect(normalizeRect({ x: 1440, y: 450, w: 144, h: 90, label: "p" }, { width: 2880, height: 1800 })).toEqual({
      x: 0.5, y: 0.25, w: 0.05, h: 0.05, label: "p",
    });
  });
  it("clamps to the screen and drops empty rects", () => {
    expect(normalizeRect({ x: 0.9, y: 0.9, w: 0.5, h: 0.5, label: "edge" })).toEqual({ x: 0.9, y: 0.9, w: 0.1, h: 0.1, label: "edge" });
    expect(normalizeRect({ x: 0.2, y: 0.2, w: 0, h: 0.1, label: "none" })).toBeNull();
    expect(formatRect({ x: 0, y: 0, w: 1, h: 1, label: "all" })).toBe("[RECT: 0, 0, 1, 1, all]");
  });
});
