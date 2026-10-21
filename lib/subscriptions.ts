import type Stripe from "stripe";
import { prisma } from "./prisma";
import { idOf, planFromSubscription } from "./billing";
import type { PlanId } from "./plans";

/** Stores a Stripe subscription and sets User.plan from it. Called only from the verified webhook. */
export async function applySubscription(userId: string, sub: Stripe.Subscription): Promise<PlanId> {
  const plan = planFromSubscription(sub);
  const priceId = sub.items.data[0]?.price.id ?? null;
  const end = (sub as unknown as { current_period_end?: number }).current_period_end;
  const currentPeriodEnd = typeof end === "number" ? new Date(end * 1000) : null;
  const customerId = idOf(sub.customer);
  await prisma.$transaction([
    prisma.subscription.upsert({
      where: { id: sub.id },
      create: { id: sub.id, userId, plan, status: sub.status, priceId, currentPeriodEnd },
      update: { plan, status: sub.status, priceId, currentPeriodEnd },
    }),
    prisma.user.update({
      where: { id: userId },
      data: { plan, stripeSubscriptionId: plan === "FREE" ? null : sub.id, ...(customerId ? { stripeCustomerId: customerId } : {}) },
    }),
  ]);
  return plan;
}
