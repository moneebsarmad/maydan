import { ArrowUpRight, ChevronRight } from "lucide-react";
import { summaryCards, recentActivity } from "@/lib/utils/demo-data";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-stone-200 bg-[linear-gradient(135deg,_#111827_0%,_#1e293b_55%,_#334155_100%)] p-6 text-white shadow-sm">
        <p className="text-xs uppercase tracking-[0.35em] text-amber-200/80">
          Dashboard
        </p>
        <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-4xl font-semibold tracking-tight">
              Keep every event moving through the right chain.
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-slate-300">
              This shell previews the submitter and approver workspace before
              Supabase data wiring begins in later phases.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm text-slate-100">
            Daily snapshot
            <ArrowUpRight className="h-4 w-4 text-amber-300" />
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {summaryCards.map((card) => (
          <article
            key={card.title}
            className="rounded-[1.75rem] border border-stone-200 bg-white p-5 shadow-sm"
          >
            <p className="text-xs uppercase tracking-[0.28em] text-stone-500">
              {card.title}
            </p>
            <p className="mt-4 text-4xl font-semibold tracking-tight text-slate-950">
              {card.value}
            </p>
            <p className="mt-2 text-sm leading-6 text-stone-600">
              {card.detail}
            </p>
          </article>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
        <article className="rounded-[1.75rem] border border-stone-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-stone-500">
                Recent activity
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                What moved today
              </h2>
            </div>
            <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-stone-600">
              Placeholder feed
            </span>
          </div>
          <div className="mt-5 space-y-4">
            {recentActivity.map((item, index) => (
              <div
                className="flex items-start justify-between gap-4 rounded-2xl bg-stone-50 px-4 py-4"
                key={item}
              >
                <div>
                  <p className="text-sm font-semibold text-slate-950">
                    Update {index + 1}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-stone-600">{item}</p>
                </div>
                <ChevronRight className="mt-1 h-4 w-4 text-stone-400" />
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-[1.75rem] border border-stone-200 bg-white p-6 shadow-sm">
          <p className="text-xs uppercase tracking-[0.28em] text-stone-500">
            Milestone view
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">
            Phase 2 priorities
          </h2>
          <div className="mt-5 space-y-3 text-sm text-stone-600">
            <div className="rounded-2xl border border-stone-200 px-4 py-4">
              Full route coverage for dashboard, events, approvals, calendar,
              and admin views.
            </div>
            <div className="rounded-2xl border border-stone-200 px-4 py-4">
              Static submission form with validation and marketing sub-form
              toggle behavior.
            </div>
            <div className="rounded-2xl border border-stone-200 px-4 py-4">
              Responsive shell ready for auth and data wiring in Phases 3 and 4.
            </div>
          </div>
        </article>
      </section>
    </div>
  );
}
