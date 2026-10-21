import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { idOf, planFromSubscription } from "@/lib/billing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Stripe webhooks: keeps User.plan in sync with the subscription. Signature-verified and idempotent. */
export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret || !process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "Stripe webhooks are not configured" }, { status: 503 });
  }
  const signature = req.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Missing signature" }, { status: 400 });

  const raw = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(raw, signature, secret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    await prisma.stripeEvent.create({ data: { id: event.id, type: event.type } });
  } catch {
    return NextResponse.json({ received: true, duplicate: true });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      const userId = session.client_reference_id ?? session.metadata?.userId;
      const subscriptionId = idOf(session.subscription);
      if (userId && subscriptionId) {
        const sub = await stripe().subscriptions.retrieve(subscriptionId);
        await prisma.user.update({
          where: { id: userId },
          data: { stripeCustomerId: idOf(session.customer), stripeSubscriptionId: sub.id, plan: planFromSubscription(sub) },
        });
      }
      break;
    }
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const sub = event.data.object;
      const customerId = idOf(sub.customer);
      if (!customerId) break;
      const plan = event.type === "customer.subscription.deleted" ? "FREE" : planFromSubscription(sub);
      await prisma.user.updateMany({
        where: { stripeCustomerId: customerId },
        data: { plan, stripeSubscriptionId: plan === "FREE" ? null : sub.id },
      });
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
