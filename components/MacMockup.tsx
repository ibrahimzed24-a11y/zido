import { ZBuddy } from "./ZBuddy";

/** A floating macOS window with the notch, Zido's chat and one highlight drawn on the screen. */
export function MacMockup() {
  return (
    <div className="float-slow relative mx-auto w-full max-w-4xl">
      <div className="overflow-hidden rounded-[22px] border border-white/10 bg-neutral-900 shadow-[0_40px_120px_-20px_rgba(139,92,246,0.45)]">
        <div className="relative h-[380px] bg-[linear-gradient(135deg,#1e1b4b_0%,#0a0a0a_55%,#312e81_100%)] md:h-[460px]">
          <div className="absolute left-1/2 top-0 flex h-8 w-56 -translate-x-1/2 items-center justify-center gap-2 rounded-b-2xl bg-black">
            <ZBuddy size={18} />
            <span className="text-[11px] text-neutral-300">Zido</span>
          </div>
          <div className="absolute left-[8%] top-[18%] w-[52%] rounded-xl border border-white/10 bg-white/90 p-4 text-left text-neutral-800 shadow-xl">
            <div className="mb-3 flex gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
            </div>
            <div className="space-y-2">
              <div className="h-2 w-3/4 rounded bg-neutral-300" />
              <div className="h-2 w-1/2 rounded bg-neutral-200" />
              <div className="h-2 w-2/3 rounded bg-neutral-200" />
            </div>
            <div className="relative mt-5 inline-block rounded-md bg-neutral-900 px-3 py-1.5 text-xs text-white">
              Deploy
              <span className="absolute -inset-2 rounded-lg border-2 border-zido-400" />
              <span className="absolute -top-7 left-0 whitespace-nowrap rounded bg-zido-500 px-2 py-0.5 text-[10px]">Click here</span>
            </div>
          </div>
          <div className="absolute right-[6%] top-[14%] w-[34%] rounded-2xl border border-white/15 bg-white/10 p-4 text-left text-sm text-white backdrop-blur-xl">
            <p className="rounded-xl bg-white/15 px-3 py-2 text-xs">How do I ship this?</p>
            <p className="mt-3 text-xs leading-relaxed text-neutral-200">Press the highlighted Deploy button. I&apos;ll watch the build with you.</p>
          </div>
        </div>
      </div>
      <div className="mx-auto h-3 w-[60%] rounded-b-2xl bg-neutral-800" />
    </div>
  );
}
