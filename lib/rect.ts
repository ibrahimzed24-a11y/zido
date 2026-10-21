export type Rect = { x: number; y: number; w: number; h: number; label: string };

const RECT_RE = /\[RECT:\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\s*,\s*([^\]]*?)\s*\]/g;

/** Pulls [RECT: x, y, w, h, label] tags out of a reply. Coordinates are screenshot pixels, origin top-left. */
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
