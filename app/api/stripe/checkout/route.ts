import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPlan } from "@/lib/plans";
import { stripe } from "@/lib/stripe";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.redirect(new URL("/api/auth/github", req.url), 303);

  const form = await req.formData();
  const plan = getPlan(String(form.get("plan") ?? ""));
  const priceId = plan.stripePriceEnv ? process.env[plan.stripePriceEnv] : undefined;
  const appUrl = process.env.APP_URL;
  if (!priceId || !process.env.STRIPE_SECRET_KEY || !appUrl) {
    return NextResponse.json(
      { error: "Stripe is not configured yet (STRIPE_SECRET_KEY, STRIPE_PRICE_PRO / STRIPE_PRICE_MAX, APP_URL)." },
      { status: 503 },
    );
  }

  const s = stripe();
  let customerId = user.stripeCustomerId;
  if (!customerId) {
    const customer = await s.customers.create({
      email: user.email ?? undefined,
      name: user.name ?? undefined,
      metadata: { userId: user.id },
    });
    customerId = customer.id;
    await prisma.user.update({ where: { id: user.id }, data: { stripeCustomerId: customerId } });
  }

  const session = await s.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    client_reference_id: user.id,
    metadata: { userId: user.id, plan: plan.id },
    success_url: `${appUrl}/dashboard/settings?checkout=success`,
    cancel_url: `${appUrl}/#pricing`,
  });
  return NextResponse.redirect(session.url ?? `${appUrl}/dashboard/settings`, 303);
}
