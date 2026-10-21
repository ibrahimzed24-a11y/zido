export type PlanId = "FREE" | "PRO" | "MAX";

export type PlanInfo = {
  id: PlanId;
  name: string;
  price: number;
  tagline: string;
  features: string[];
  visionPerDay: number;
  agentTasksPerMonth: number;
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
    features: ["Unlimited screen questions (fair use)", "Unlimited agent tasks", "Early access to new agents", "Priority support"],
    visionPerDay: 5000,
    agentTasksPerMonth: 100000,
    stripePriceEnv: "STRIPE_PRICE_MAX",
  },
];

export function getPlan(id: string): PlanInfo {
  return PLANS.find((p) => p.id === id) ?? PLANS[0];
}

export function planForPrice(priceId: string | null | undefined, env: Record<string, string | undefined> = process.env): PlanId {
  if (!priceId) return "FREE";
  if (priceId === env.STRIPE_PRICE_PRO) return "PRO";
  if (priceId === env.STRIPE_PRICE_MAX) return "MAX";
  return "FREE";
}

export function canUseAgents(plan: PlanId): boolean {
  return getPlan(plan).agentTasksPerMonth > 0;
}
