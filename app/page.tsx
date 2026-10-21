import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Pricing } from "@/components/Pricing";
import { MacMockup } from "@/components/MacMockup";
import { ZBuddy } from "@/components/ZBuddy";

const STEPS = [
  { title: "Grab", text: "Move to the notch. Zido looks at what is on your screen, only when you ask." },
  { title: "Say Hello", text: "Ask in plain words. Zido answers and draws the way right on top of your apps." },
  { title: "Get it Done", text: "On Pro and Max, Zido creates the repo, writes the files and ships it to Vercel." },
];

export default function Home() {
  return (
    <div className="relative overflow-hidden bg-black">
      <nav className="relative mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Link href="/" className="flex items-center gap-2 text-lg font-semibold">
          <ZBuddy size={28} /> Zido
        </Link>
        <div className="flex items-center gap-6 text-sm text-neutral-400">
          <a href="#how" className="hover:text-white">How it works</a>
          <a href="#pricing" className="hover:text-white">Pricing</a>
          <a href="/api/auth/github" className="rounded-full bg-white px-4 py-1.5 font-medium text-black hover:bg-neutral-200">
            Sign in
          </a>
        </div>
      </nav>

      <header className="relative mx-auto max-w-5xl px-6 pb-16 pt-20 text-center">
        <div className="mb-8 flex justify-center">
          <ZBuddy size={72} />
        </div>
        <h1 className="text-5xl font-semibold tracking-tight md:text-7xl">Meet Zido, your new AI best friend.</h1>
        <p className="mx-auto mt-6 max-w-2xl text-xl text-neutral-400">
          It lives in your Mac&apos;s notch, sees what you see, and shows you exactly where to click.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <a href="/api/auth/github" className="flex items-center gap-2 rounded-full bg-zido-500 px-6 py-3 font-medium hover:bg-zido-600">
            Get started free <ArrowRight className="h-4 w-4" />
          </a>
          <a href="#pricing" className="rounded-full px-6 py-3 font-medium text-zido-400 hover:underline">
            See pricing ›
          </a>
        </div>
      </header>

      <section className="px-6 pb-24 [perspective:1600px]">
        <MacMockup />
      </section>

      <section id="how" className="mx-auto max-w-5xl px-6 py-24">
        <h2 className="text-center text-4xl font-semibold tracking-tight md:text-5xl">Three steps. That&apos;s it.</h2>
        <ol className="mt-16 grid gap-12 md:grid-cols-3">
          {STEPS.map(({ title, text }, i) => (
            <li key={title} className="text-center">
              <span className="text-sm font-medium text-zido-400">Step {i + 1}</span>
              <h3 className="mt-2 text-2xl font-semibold">{title}</h3>
              <p className="mt-3 text-neutral-400">{text}</p>
            </li>
          ))}
        </ol>
      </section>

      <Pricing />

      <footer className="border-t border-white/10 py-10 text-center text-sm text-neutral-500">
        Zido for macOS 14 and later · © {new Date().getFullYear()}
      </footer>
    </div>
  );
}
