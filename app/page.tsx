import Link from "next/link";
import { ArrowRight, Eye, Github, MessageCircle, MousePointerClick, Rocket, Shield, Sparkles, Zap } from "lucide-react";
import { Pricing } from "@/components/Pricing";

const STEPS = [
  {
    icon: MousePointerClick,
    title: "Grab",
    text: "Move to the notch or press the shortcut. Zido takes a look at what is on your screen, nothing more.",
  },
  {
    icon: MessageCircle,
    title: "Say Hello",
    text: "Ask anything in plain words. Zido answers and draws highlights right on top of the app you are using.",
  },
  {
    icon: Rocket,
    title: "Get it Done",
    text: "On Pro, Zido creates the GitHub repo, writes the files and ships to Vercel for you.",
  },
];

const FEATURES = [
  { icon: Eye, title: "Sees what you see", text: "Real-time screen understanding, powered by Claude." },
  { icon: Sparkles, title: "Shows, not tells", text: "On-screen overlays point to the exact button." },
  { icon: Github, title: "Agentic coding", text: "Repos, commits and deploys through GitHub and Vercel." },
  { icon: Shield, title: "Private by design", text: "Tokens encrypted at rest. Zido never captures itself." },
];

export default function Home() {
  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[600px] bg-[radial-gradient(ellipse_at_top,rgba(139,92,246,0.35),transparent_60%)]" />

      <nav className="relative mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Link href="/" className="flex items-center gap-2 text-lg font-semibold">
          <Sparkles className="h-5 w-5 text-zido-400" /> Zido
        </Link>
        <div className="flex items-center gap-6 text-sm text-neutral-300">
          <a href="#how" className="hover:text-white">How it works</a>
          <a href="#pricing" className="hover:text-white">Pricing</a>
          <a href="/api/auth/github" className="rounded-full bg-white px-4 py-2 font-medium text-neutral-900 hover:bg-neutral-200">
            Sign in
          </a>
        </div>
      </nav>

      <header className="relative mx-auto max-w-4xl px-6 pb-24 pt-16 text-center">
        <div className="mx-auto mb-10 flex h-10 w-56 items-center justify-center gap-2 rounded-b-3xl bg-black text-sm shadow-2xl shadow-zido-600/30 ring-1 ring-white/10">
          <span className="h-2 w-2 animate-pulse rounded-full bg-zido-400" /> Zido is listening
        </div>
        <h1 className="text-5xl font-semibold tracking-tight md:text-7xl">Meet Zido, your new AI best friend.</h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-neutral-400">
          A digital shadow that lives in your Mac&apos;s notch. It sees your screen, shows you exactly where to click,
          and gets the work done for you.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <a href="/api/auth/github" className="flex items-center gap-2 rounded-full bg-zido-500 px-6 py-3 font-medium hover:bg-zido-600">
            Get started free <ArrowRight className="h-4 w-4" />
          </a>
          <a href="#pricing" className="rounded-full border border-white/15 px-6 py-3 font-medium hover:bg-white/5">
            See pricing
          </a>
        </div>
      </header>

      <section id="how" className="mx-auto max-w-6xl px-6 py-24">
        <h2 className="text-center text-3xl font-semibold md:text-4xl">Grab → Say Hello → Get it Done</h2>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {STEPS.map(({ icon: Icon, title, text }, i) => (
            <div key={title} className="rounded-3xl border border-white/10 bg-white/5 p-8">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-zido-500/20 text-zido-400">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="text-sm text-neutral-500">Step {i + 1}</span>
              </div>
              <h3 className="mt-6 text-xl font-semibold">{title}</h3>
              <p className="mt-2 text-neutral-400">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-6 py-12 md:grid-cols-4">
        {FEATURES.map(({ icon: Icon, title, text }) => (
          <div key={title} className="rounded-2xl p-4">
            <Icon className="h-6 w-6 text-zido-400" />
            <h3 className="mt-4 font-semibold">{title}</h3>
            <p className="mt-1 text-sm text-neutral-400">{text}</p>
          </div>
        ))}
      </section>

      <Pricing />

      <footer className="border-t border-white/10 py-10 text-center text-sm text-neutral-500">
        <p className="flex items-center justify-center gap-2">
          <Zap className="h-4 w-4" /> Zido for macOS · © {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
}
