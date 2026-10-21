import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { stripe, verifyStripeEvent } from "@/lib/stripe";
import { idOf } from "@/lib/billing";
import { applySubscription } from "@/lib/subscriptions";
import { logActivity } from "@/lib/activity";
import { missingEnv } from "@/lib/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Stripe webhooks: keeps User.plan in sync with the subscription. Signature-verified and idempotent. */
export async function POST(req: Request) {
  const signature = req.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Missing Stripe-Signature header" }, { status: 400 });

  const missing = missingEnv(["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET"]);
  if (missing.length) {
    return NextResponse.json({ error: `Stripe webhooks are not configured (${missing.join(", ")})` }, { status: 503 });
  }

  const raw = await req.text();
  let event: Stripe.Event;
  try {
    event = verifyStripeEvent(raw, signature, process.env.STRIPE_WEBHOOK_SECRET as string);
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
        const plan = await applySubscription(userId, sub);
        await logActivity(userId, "billing", `Plan is now ${plan}`);
      }
      break;
    }
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const sub = event.data.object;
      const customerId = idOf(sub.customer);
      const user = customerId ? await prisma.user.findUnique({ where: { stripeCustomerId: customerId } }) : null;
      if (user) {
        const plan = await applySubscription(user.id, sub);
        if (plan !== user.plan) await logActivity(user.id, "billing", `Plan changed from ${user.plan} to ${plan}`);
      }
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
