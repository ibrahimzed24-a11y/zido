import { planForPrice, type PlanId } from "./plans";

export type SubscriptionLike = { status: string; items: { data: { price: { id: string } }[] } };

const PAID_STATUSES = ["active", "trialing", "past_due"];

export function planFromSubscription(sub: SubscriptionLike, env: Record<string, string | undefined> = process.env): PlanId {
  if (!PAID_STATUSES.includes(sub.status)) return "FREE";
  return planForPrice(sub.items.data[0]?.price.id, env);
}

export function idOf(value: string | { id: string } | null | undefined): string | null {
  if (!value) return null;
  return typeof value === "string" ? value : value.id;
}
