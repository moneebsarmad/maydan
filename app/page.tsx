import Link from "next/link";
import { configuredAppEnvCount, requiredAppEnv } from "@/lib/supabase/env";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(245,158,11,0.22),_transparent_30%),linear-gradient(180deg,_#09090b_0%,_#111827_100%)] px-6 py-16 text-slate-50">
      <div className="mx-auto max-w-5xl rounded-[2rem] border border-white/10 bg-slate-950/70 p-8 shadow-2xl shadow-black/40 backdrop-blur">
        <p className="text-sm uppercase tracking-[0.3em] text-amber-300">
          Phase 1 Foundation
        </p>
        <h1 className="mt-4 text-5xl font-semibold tracking-tight">
          Maydan
        </h1>
        <p className="mt-4 max-w-2xl text-base text-slate-300">
          Next.js 14, Tailwind CSS, shadcn/ui baseline, and Supabase session
          middleware are scaffolded. External project credentials still need to
          be connected to complete the deployment milestone. Phase 2 local UI
          work can continue from here.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/dashboard"
            className="rounded-full bg-amber-300 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-200"
          >
            Open Dashboard Shell
          </Link>
          <Link
            href="/login"
            className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-slate-100 transition hover:border-white/30 hover:bg-white/5"
          >
            Open Login Shell
          </Link>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <section className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
            <h2 className="text-sm font-medium uppercase tracking-[0.2em] text-slate-400">
              Stack
            </h2>
            <ul className="mt-4 space-y-2 text-sm text-slate-200">
              <li>Next.js 14 App Router with TypeScript</li>
              <li>Tailwind CSS configured for shadcn/ui</li>
              <li>Supabase SSR helpers wired for browser and server usage</li>
              <li>Root middleware prepared for auth session refresh</li>
            </ul>
          </section>

          <section className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
            <h2 className="text-sm font-medium uppercase tracking-[0.2em] text-slate-400">
              Environment
            </h2>
            <p className="mt-4 text-3xl font-semibold text-emerald-300">
              {configuredAppEnvCount}/{requiredAppEnv.length}
            </p>
            <p className="mt-2 text-sm text-slate-300">
              Required environment variables currently populated.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
