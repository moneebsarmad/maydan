import Link from "next/link";

interface AuthShellProps {
  eyebrow: string;
  title: string;
  description: string;
  footer: React.ReactNode;
  children: React.ReactNode;
}

export function AuthShell({
  eyebrow,
  title,
  description,
  footer,
  children,
}: AuthShellProps) {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(245,158,11,0.18),_transparent_28%),linear-gradient(180deg,_#f5f5f4_0%,_#e7e5e4_100%)] px-6 py-10">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl overflow-hidden rounded-[2rem] border border-stone-200 bg-white shadow-[0_40px_120px_rgba(15,23,42,0.14)] lg:grid-cols-[1.05fr_0.95fr]">
        <section className="relative hidden overflow-hidden bg-[linear-gradient(180deg,_#0f172a_0%,_#111827_55%,_#334155_100%)] p-10 text-white lg:block">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(245,158,11,0.26),_transparent_25%)]" />
          <div className="relative z-10 flex h-full flex-col justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.38em] text-amber-200/90">
                BHA Prep
              </p>
              <h1 className="mt-4 text-5xl font-semibold tracking-tight">
                Maydan
              </h1>
              <p className="mt-4 max-w-md text-base leading-7 text-slate-300">
                A focused internal workspace for event submissions, approvals,
                notifications, and calendar coordination.
              </p>
            </div>

            <div className="space-y-4 rounded-[1.75rem] border border-white/10 bg-white/5 p-6 backdrop-blur">
              <div className="flex items-center justify-between text-sm text-slate-300">
                <span>Routing matrix</span>
                <span>5 chains</span>
              </div>
              <div className="grid gap-3 text-sm text-slate-200">
                <div className="rounded-2xl bg-white/5 px-4 py-3">
                  Clubs route through advisers and HS leadership.
                </div>
                <div className="rounded-2xl bg-white/5 px-4 py-3">
                  Houses and athletics use three-step approval chains.
                </div>
                <div className="rounded-2xl bg-white/5 px-4 py-3">
                  Facilities Director is always copied, never blocking.
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="flex items-center p-6 sm:p-10">
          <div className="mx-auto w-full max-w-md">
            <Link
              href="/"
              className="text-sm font-medium uppercase tracking-[0.28em] text-stone-500 transition hover:text-slate-950"
            >
              {eyebrow}
            </Link>
            <h2 className="mt-6 text-4xl font-semibold tracking-tight text-slate-950">
              {title}
            </h2>
            <p className="mt-3 text-base leading-7 text-stone-600">
              {description}
            </p>
            <div className="mt-8">{children}</div>
            <div className="mt-8 border-t border-stone-200 pt-6 text-sm text-stone-500">
              {footer}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
