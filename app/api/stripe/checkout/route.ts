import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPlan } from "@/lib/plans";
import { stripe } from "@/lib/stripe";
import { appUrl, missingEnv } from "@/lib/config";

export const dynamic = "force-dynamic";

/** Starts Stripe Checkout for Pro or Max. The plan only changes when the verified webhook arrives. */
export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.redirect(new URL("/api/auth/github", req.url), 303);

  const form = await req.formData();
  const requested = String(form.get("plan") ?? "");
  if (requested !== "PRO" && requested !== "MAX") {
    return NextResponse.json({ error: "Choose Pro or Max" }, { status: 400 });
  }
  const plan = getPlan(requested);
  const base = appUrl();
  const missing = missingEnv(["STRIPE_SECRET_KEY", plan.stripePriceEnv as string]);
  const priceId = process.env[plan.stripePriceEnv as string];
  if (missing.length || !priceId || !base) {
    return NextResponse.json({ error: `Stripe is not configured (${[...missing, ...(base ? [] : ["APP_URL"])].join(", ")})` }, { status: 503 });
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
    subscription_data: { metadata: { userId: user.id, plan: plan.id } },
    success_url: `${base}/dashboard/settings?checkout=success`,
    cancel_url: `${base}/#pricing`,
  });
  return NextResponse.redirect(session.url ?? `${base}/dashboard/settings`, 303);
}
