export type PlanId = "FREE" | "PRO" | "MAX";

/** The plan every new account starts on, and the one an account falls back to without an active paid subscription. */
export const DEFAULT_PLAN: PlanId = "MAX";

export type PlanInfo = {
  id: PlanId;
  name: string;
  price: number;
  tagline: string;
  features: string[];
  /** Screen questions per 24 hours; null means unlimited. */
  visionPerDay: number | null;
  /** Agent tool calls per calendar month; null means unlimited. */
  agentTasksPerMonth: number | null;
  recommended?: boolean;
  stripePriceEnv?: "STRIPE_PRICE_PRO" | "STRIPE_PRICE_MAX";
};

export const PLANS: PlanInfo[] = [
  {
    id: "FREE",
    name: "Free",
    price: 0,
    tagline: "Say hello to Zido.",
    features: ["30 screen questions a day", "On-screen guidance with highlights", "PROFILE.md memory"],
    visionPerDay: 30,
    agentTasksPerMonth: 0,
  },
  {
    id: "PRO",
    name: "Pro",
    price: 20,
    tagline: "Zido sees it and does it.",
    features: ["500 screen questions a day", "Agent tasks: GitHub repos and files", "One-click Vercel deploys", "Priority model access"],
    visionPerDay: 500,
    agentTasksPerMonth: 200,
    recommended: true,
    stripePriceEnv: "STRIPE_PRICE_PRO",
  },
  {
    id: "MAX",
    name: "Max",
    price: 100,
    tagline: "Your full-time digital shadow.",
    features: ["Unlimited screen questions", "Unlimited agent tasks", "Early access to new agents", "Priority support"],
    visionPerDay: null,
    agentTasksPerMonth: null,
    stripePriceEnv: "STRIPE_PRICE_MAX",
  },
];

export function getPlan(id: string): PlanInfo {
  return PLANS.find((p) => p.id === id) ?? PLANS.find((p) => p.id === DEFAULT_PLAN)!;
}

export function planForPrice(priceId: string | null | undefined, env: Record<string, string | undefined> = process.env): PlanId {
  if (!priceId) return DEFAULT_PLAN;
  if (priceId === env.STRIPE_PRICE_PRO) return "PRO";
  if (priceId === env.STRIPE_PRICE_MAX) return "MAX";
  return DEFAULT_PLAN;
}

export function canUseAgents(plan: PlanId): boolean {
  const limit = getPlan(plan).agentTasksPerMonth;
  return limit === null || limit > 0;
}

/** True when another use fits under the limit; a null limit is unlimited. */
export function withinLimit(used: number, limit: number | null): boolean {
  return limit === null || used < limit;
}

export function formatLimit(limit: number | null): string {
  return limit === null ? "Unlimited" : String(limit);
}
