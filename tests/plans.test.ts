import { describe, expect, it } from "vitest";
import { canUseAgents, DEFAULT_PLAN, formatLimit, getPlan, planForPrice, PLANS, withinLimit } from "@/lib/plans";
import { idOf, planFromSubscription } from "@/lib/billing";
import { formatTimeSaved } from "@/lib/format";

const env = { STRIPE_PRICE_PRO: "price_pro", STRIPE_PRICE_MAX: "price_max" };

describe("plans and billing", () => {
  it("offers Free, Pro, Max with Pro recommended", () => {
    expect(PLANS.map((p) => p.name)).toEqual(["Free", "Pro", "Max"]);
    expect(PLANS.filter((p) => p.recommended).map((p) => p.id)).toEqual(["PRO"]);
  });

  it("maps Stripe prices to plans", () => {
    expect(planForPrice("price_pro", env)).toBe("PRO");
    expect(planForPrice("price_max", env)).toBe("MAX");
    expect(planForPrice("price_other", env)).toBe("MAX");
    expect(planForPrice(null, env)).toBe("MAX");
  });

  it("falls back to the default plan for inactive subscriptions", () => {
    const sub = (status: string) => ({ status, items: { data: [{ price: { id: "price_max" } }] } });
    expect(planFromSubscription(sub("active"), env)).toBe("MAX");
    expect(planFromSubscription(sub("canceled"), env)).toBe(DEFAULT_PLAN);
  });

  it("gates agents to paid plans", () => {
    expect(canUseAgents("FREE")).toBe(false);
    expect(canUseAgents("PRO")).toBe(true);
    expect(canUseAgents("MAX")).toBe(true);
    expect(getPlan("nope").id).toBe("MAX");
    expect(idOf({ id: "cus_1" })).toBe("cus_1");
    expect(idOf(null)).toBeNull();
  });

  it("makes Max the unlimited default", () => {
    expect(DEFAULT_PLAN).toBe("MAX");
    const max = getPlan("MAX");
    expect(max.visionPerDay).toBeNull();
    expect(max.agentTasksPerMonth).toBeNull();
    expect(withinLimit(1_000_000, max.visionPerDay)).toBe(true);
    expect(withinLimit(30, getPlan("FREE").visionPerDay)).toBe(false);
    expect(withinLimit(29, 30)).toBe(true);
    expect(formatLimit(null)).toBe("Unlimited");
    expect(formatLimit(500)).toBe("500");
  });

  it("formats Time Saved", () => {
    expect(formatTimeSaved(30)).toBe("30s");
    expect(formatTimeSaved(600)).toBe("10m");
    expect(formatTimeSaved(8100)).toBe("2h 15m");
    expect(formatTimeSaved(7200)).toBe("2h");
  });
});
