import { DEFAULT_PLAN, planForPrice, type PlanId } from "./plans";

export type SubscriptionLike = { status: string; items: { data: { price: { id: string } }[] } };

const PAID_STATUSES = ["active", "trialing", "past_due"];

export function isPaidSubscription(sub: SubscriptionLike): boolean {
  return PAID_STATUSES.includes(sub.status);
}

export function planFromSubscription(sub: SubscriptionLike, env: Record<string, string | undefined> = process.env): PlanId {
  if (!isPaidSubscription(sub)) return DEFAULT_PLAN;
  return planForPrice(sub.items.data[0]?.price.id, env);
}

export function idOf(value: string | { id: string } | null | undefined): string | null {
  if (!value) return null;
  return typeof value === "string" ? value : value.id;
}
