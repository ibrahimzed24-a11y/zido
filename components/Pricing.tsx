import { Check } from "lucide-react";
import { PLANS } from "@/lib/plans";

export function Pricing({ currentPlan }: { currentPlan?: string }) {
  return (
    <section id="pricing" className="mx-auto max-w-6xl px-6 py-24">
      <h2 className="text-center text-3xl font-semibold md:text-4xl">Pricing</h2>
      <p className="mt-3 text-center text-neutral-400">Every account starts on Max, with unlimited usage.</p>
      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {PLANS.map((plan) => (
          <div
            key={plan.id}
            className={`relative flex flex-col rounded-3xl border p-8 ${
              plan.recommended ? "border-zido-500 bg-zido-900/40 shadow-2xl shadow-zido-600/20" : "border-white/10 bg-white/5"
            }`}
          >
            {plan.recommended && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-zido-500 px-3 py-1 text-xs font-semibold">
                Recommended
              </span>
            )}
            <h3 className="text-xl font-semibold">{plan.name}</h3>
            <p className="mt-1 text-sm text-neutral-400">{plan.tagline}</p>
            <p className="mt-6 text-4xl font-bold">
              ${plan.price}
              <span className="text-base font-normal text-neutral-400">/mo</span>
            </p>
            <ul className="mt-6 flex-1 space-y-3 text-sm">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-zido-400" /> {f}
                </li>
              ))}
            </ul>
            {currentPlan === plan.id ? (
              <p className="mt-8 rounded-full border border-white/15 py-2 text-center text-sm text-neutral-400">Current plan</p>
            ) : plan.id === "FREE" ? (
              <a href="/api/auth/github" className="mt-8 rounded-full border border-white/15 py-2 text-center font-medium hover:bg-white/5">
                Start free
              </a>
            ) : (
              <form action="/api/stripe/checkout" method="post" className="mt-8">
                <input type="hidden" name="plan" value={plan.id} />
                <button
                  type="submit"
                  className={`w-full rounded-full py-2 font-medium ${plan.recommended ? "bg-zido-500 hover:bg-zido-600" : "bg-white text-neutral-900 hover:bg-neutral-200"}`}
                >
                  Choose {plan.name}
                </button>
              </form>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
