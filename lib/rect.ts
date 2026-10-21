export type Rect = { x: number; y: number; w: number; h: number; label: string };

const RECT_RE = /\[RECT:\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\s*,\s*([^\]]*?)\s*\]/g;

/** Pulls [RECT: x, y, w, h, label] tags out of a reply. */
export function parseRects(text: string): { clean: string; rects: Rect[] } {
  const rects: Rect[] = [];
  const clean = text
    .replace(RECT_RE, (_m: string, x: string, y: string, w: string, h: string, label: string) => {
      rects.push({ x: Number(x), y: Number(y), w: Number(w), h: Number(h), label });
      return "";
    })
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return { clean, rects };
}

export function clampRect(r: Rect, width: number, height: number): Rect {
  const x = Math.max(0, Math.min(r.x, width));
  const y = Math.max(0, Math.min(r.y, height));
  return { ...r, x, y, w: Math.max(0, Math.min(r.w, width - x)), h: Math.max(0, Math.min(r.h, height - y)) };
}

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const round4 = (v: number) => Math.round(v * 10000) / 10000;

export function cleanLabel(label: string): string {
  return label.replace(/[[\]\r\n]/g, " ").replace(/\s+/g, " ").trim().slice(0, 60) || "here";
}

/**
 * Converts a rect to normalized 0-1 fractions of the screenshot (origin top-left).
 * The model is asked for fractions; a 0-1000 grid answer is divided by 1000, and pixel
 * answers (values above 1000 with a known screen size) are divided by the screenshot size.
 */
export function normalizeRect(r: Rect, screen?: { width: number; height: number }): Rect | null {
  const values = [r.x, r.y, r.w, r.h];
  if (values.some((v) => !Number.isFinite(v))) return null;
  let sx = 1;
  let sy = 1;
  const max = Math.max(...values);
  if (max > 1) {
    if (screen && max > 1000) {
      sx = screen.width;
      sy = screen.height;
    } else {
      sx = 1000;
      sy = 1000;
    }
  }
  const x = clamp01(r.x / sx);
  const y = clamp01(r.y / sy);
  const w = Math.min(clamp01(r.w / sx), 1 - x);
  const h = Math.min(clamp01(r.h / sy), 1 - y);
  if (w <= 0 || h <= 0) return null;
  return { x: round4(x), y: round4(y), w: round4(w), h: round4(h), label: cleanLabel(r.label) };
}

/** The exact tag form: [RECT: x, y, w, h, label] */
export function formatRect(r: Rect): string {
  return `[RECT: ${r.x}, ${r.y}, ${r.w}, ${r.h}, ${r.label}]`;
}

/** Guidance text plus normalized rects, as returned by /api/zido/vision. */
export function extractGuidance(text: string, screen?: { width: number; height: number }) {
  const { clean, rects } = parseRects(text);
  const normalized = rects
    .map((r) => normalizeRect(r, screen))
    .filter((r): r is Rect => r !== null)
    .slice(0, 5);
  return { guidance: clean, rects: normalized, rectTags: normalized.map(formatRect) };
}
