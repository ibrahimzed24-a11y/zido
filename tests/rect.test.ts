import { describe, expect, it } from "vitest";
import { clampRect, parseRects } from "@/lib/rect";

describe("[RECT: x, y, w, h, label]", () => {
  it("extracts rects and cleans the reply", () => {
    const { clean, rects } = parseRects("Click Deploy.\n[RECT: 120, 48, 90, 32, Deploy button]\nThen wait.");
    expect(rects).toEqual([{ x: 120, y: 48, w: 90, h: 32, label: "Deploy button" }]);
    expect(clean).toBe("Click Deploy.\n\nThen wait.");
  });

  it("handles several tags and decimals", () => {
    const { rects } = parseRects("[RECT:1,2,3,4,a] and [RECT: 10.5, 20, 30, 40, b]");
    expect(rects.map((r) => r.label)).toEqual(["a", "b"]);
    expect(rects[1].x).toBe(10.5);
  });

  it("ignores malformed tags", () => {
    expect(parseRects("[RECT: a, b]").rects).toHaveLength(0);
  });

  it("clamps to the screenshot", () => {
    expect(clampRect({ x: 1900, y: -5, w: 100, h: 50, label: "x" }, 1920, 1080)).toEqual({ x: 1900, y: 0, w: 20, h: 50, label: "x" });
  });
});
