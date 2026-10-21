export type VisionInput = {
  image: string;
  mediaType: "image/png" | "image/jpeg";
  question: string;
  conversationId?: string;
  screen?: { width: number; height: number };
  allowAgents: boolean;
};

export const MAX_IMAGE_BASE64 = 7_000_000;

/** Body of POST /api/zido/vision: { image: base64, question (or query), screen?, conversationId? }. */
export function parseVisionRequest(body: unknown): { ok: true; value: VisionInput } | { ok: false; error: string } {
  if (!body || typeof body !== "object") return { ok: false, error: "JSON body required" };
  const b = body as Record<string, unknown>;

  const image = typeof b.image === "string" ? b.image.replace(/^data:image\/\w+;base64,/, "").replace(/\s+/g, "") : "";
  if (!image) return { ok: false, error: "image (base64 screenshot) is required" };
  if (image.length > MAX_IMAGE_BASE64) return { ok: false, error: "image is too large" };
  if (!/^[A-Za-z0-9+/=]+$/.test(image)) return { ok: false, error: "image must be base64" };

  const raw = typeof b.question === "string" ? b.question : typeof b.query === "string" ? b.query : "";
  const question = raw.trim();
  if (!question) return { ok: false, error: "question (or query) is required" };
  if (question.length > 4000) return { ok: false, error: "question is too long" };

  const s = b.screen as { width?: unknown; height?: unknown } | undefined;
  const screen = s && typeof s.width === "number" && typeof s.height === "number" ? { width: s.width, height: s.height } : undefined;

  return {
    ok: true,
    value: {
      image,
      mediaType: b.mediaType === "image/jpeg" ? "image/jpeg" : "image/png",
      question,
      conversationId: typeof b.conversationId === "string" ? b.conversationId : undefined,
      screen,
      allowAgents: b.allowAgents !== false,
    },
  };
}
