"use client";

import { useMemo, useState } from "react";
import {
  ArrowUpRight,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock3,
  Layers3,
  MoveDown,
  Plus,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import { AdminNav } from "@/components/admin/admin-nav";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ChainStatus = "active" | "draft" | "attention";
type StepSource = "entity_head" | "specific_user" | "title_lookup";

interface ChainStep {
  id: string;
  stepNumber: number;
  label: string;
  sourceType: StepSource;
  resolver: string;
  isBlocking: boolean;
  resolvedUser: string;
}

interface ValidationItem {
  id: string;
  tone: "success" | "warning";
  message: string;
}

interface MockChain {
  id: string;
  department: string;
  level: "HS" | "MS";
  name: string;
  status: ChainStatus;
  summary: string;
  updatedAt: string;
  customRouting: boolean;
  steps: ChainStep[];
  validations: ValidationItem[];
}

const mockChains: MockChain[] = [
  {
    id: "english-hs",
    department: "English Department",
    level: "HS",
    name: "English Department / HS",
    status: "active",
    summary: "Dept Head -> HS Dean -> HS Principal",
    updatedAt: "Updated 2 hours ago",
    customRouting: true,
    steps: [
      {
        id: "eng-1",
        stepNumber: 1,
        label: "Department Head",
        sourceType: "entity_head",
        resolver: "English Department head",
        isBlocking: true,
        resolvedUser: "Susan Almasri",
      },
      {
        id: "eng-2",
        stepNumber: 2,
        label: "HS Dean",
        sourceType: "specific_user",
        resolver: "A specific named approver",
        isBlocking: true,
        resolvedUser: "Alya Hasan",
      },
      {
        id: "eng-3",
        stepNumber: 3,
        label: "HS Principal",
        sourceType: "title_lookup",
        resolver: "HS Principal",
        isBlocking: true,
        resolvedUser: "Leila Kayed",
      },
    ],
    validations: [
      {
        id: "eng-v1",
        tone: "success",
        message: "Department head resolves to an active user.",
      },
      {
        id: "eng-v2",
        tone: "success",
        message: "HS Principal title lookup resolves correctly.",
      },
    ],
  },
  {
    id: "arabic-hs",
    department: "Arabic Department",
    level: "HS",
    name: "Arabic Department / HS",
    status: "active",
    summary: "Dept Head -> HS Principal",
    updatedAt: "Updated yesterday",
    customRouting: false,
    steps: [
      {
        id: "arabic-1",
        stepNumber: 1,
        label: "Department Head",
        sourceType: "entity_head",
        resolver: "Arabic Department head",
        isBlocking: true,
        resolvedUser: "Rayda Saleh",
      },
      {
        id: "arabic-2",
        stepNumber: 2,
        label: "HS Principal",
        sourceType: "title_lookup",
        resolver: "HS Principal",
        isBlocking: true,
        resolvedUser: "Leila Kayed",
      },
    ],
    validations: [
      {
        id: "arabic-v1",
        tone: "success",
        message: "This chain matches the current V1 fallback exactly.",
      },
    ],
  },
  {
    id: "quran-ms",
    department: "MS Quran Department",
    level: "MS",
    name: "MS Quran Department / MS",
    status: "attention",
    summary: "Dept Head -> Quran Lead -> MS Principal",
    updatedAt: "Updated 3 days ago",
    customRouting: true,
    steps: [
      {
        id: "quran-1",
        stepNumber: 1,
        label: "Department Head",
        sourceType: "entity_head",
        resolver: "MS Quran Department head",
        isBlocking: true,
        resolvedUser: "Rima Damrah",
      },
      {
        id: "quran-2",
        stepNumber: 2,
        label: "Quran Lead",
        sourceType: "specific_user",
        resolver: "A specific named approver",
        isBlocking: true,
        resolvedUser: "Unresolved",
      },
      {
        id: "quran-3",
        stepNumber: 3,
        label: "MS Principal",
        sourceType: "title_lookup",
        resolver: "MS Principal",
        isBlocking: true,
        resolvedUser: "Sami Moussa",
      },
    ],
    validations: [
      {
        id: "quran-v1",
        tone: "warning",
        message: "Step 2 does not currently resolve to an active user.",
      },
      {
        id: "quran-v2",
        tone: "success",
        message: "MS Principal title lookup resolves correctly.",
      },
    ],
  },
];

export function ApprovalChainsAdminShell() {
  const [selectedChainId, setSelectedChainId] = useState(mockChains[0]?.id ?? "");
  const selectedChain = useMemo(
    () => mockChains.find((chain) => chain.id === selectedChainId) ?? mockChains[0],
    [selectedChainId],
  );

  const summary = useMemo(() => {
    const activeCount = mockChains.filter((chain) => chain.status === "active").length;
    const customCount = mockChains.filter((chain) => chain.customRouting).length;
    const attentionCount = mockChains.filter(
      (chain) => chain.status === "attention",
    ).length;

    return [
      {
        label: "Active Chains",
        value: `${activeCount}`,
        detail: "Department-level flows currently active in the concept model.",
        icon: ShieldCheck,
      },
      {
        label: "Custom Routing",
        value: `${customCount}`,
        detail: "Departments using something beyond the fixed V1 fallback.",
        icon: Layers3,
      },
      {
        label: "Needs Attention",
        value: `${attentionCount}`,
        detail: "Chains with unresolved or risky approver mappings.",
        icon: TriangleAlert,
      },
      {
        label: "Latest Update",
        value: "Today",
        detail: "The mock keeps edit history visible for governance changes.",
        icon: Clock3,
      },
    ];
  }, []);

  if (!selectedChain) {
    return null;
  }

  return (
    <div className="space-y-6">
      <section className="animate-in fade-in-0 slide-in-from-bottom-2 duration-500">
        <div className="rounded-[2rem] border border-stone-200 bg-[linear-gradient(135deg,_#ffffff_0%,_#f8fafc_52%,_#f5f5f4_100%)] p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.32em] text-stone-500">
                Admin V2 Concept
              </p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">
                Department approval chains
              </h1>
              <p className="mt-3 max-w-3xl text-base leading-7 text-stone-600">
                A static concept for admin-managed department routing. This page
                does not write to the database or affect the live routing engine.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-amber-300 bg-amber-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-amber-950">
                <Sparkles className="h-3.5 w-3.5" />
                Concept mode
              </span>
              <Button type="button" className="gap-2">
                <Plus className="h-4 w-4" />
                Create chain
              </Button>
            </div>
          </div>
        </div>
      </section>

      <AdminNav />

      <section className="grid gap-4 lg:grid-cols-4">
        {summary.map((item, index) => {
          const Icon = item.icon;

          return (
            <article
              className="animate-in fade-in-0 slide-in-from-bottom-2 rounded-[1.75rem] border border-stone-200 bg-white p-5 shadow-sm duration-500"
              key={item.label}
              style={{ animationDelay: `${index * 70}ms` }}
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs uppercase tracking-[0.24em] text-stone-500">
                  {item.label}
                </p>
                <Icon className="h-4 w-4 text-amber-700" />
              </div>
              <p className="mt-4 text-4xl font-semibold tracking-tight text-slate-950">
                {item.value}
              </p>
              <p className="mt-2 text-sm leading-6 text-stone-600">
                {item.detail}
              </p>
            </article>
          );
        })}
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.88fr_1.45fr]">
        <aside className="space-y-4">
          <div className="rounded-[1.75rem] border border-stone-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-stone-500">
                  Chain list
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                  Department routes
                </h2>
              </div>
              <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-stone-700">
                {mockChains.length} total
              </span>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-3 xl:grid-cols-1">
              <MockFilter label="Search" value="English, Arabic, Quran..." />
              <MockFilter label="Level" value="All levels" />
              <MockFilter label="Status" value="All statuses" />
            </div>
          </div>

          <div className="space-y-3">
            {mockChains.map((chain, index) => {
              const isActive = chain.id === selectedChain.id;

              return (
                <button
                  className={cn(
                    "animate-in fade-in-0 slide-in-from-bottom-2 w-full rounded-[1.75rem] border bg-white p-5 text-left shadow-sm transition-all duration-300",
                    isActive
                      ? "border-amber-300 ring-2 ring-amber-200/70"
                      : "border-stone-200 hover:-translate-y-0.5 hover:border-stone-300 hover:shadow-md",
                  )}
                  key={chain.id}
                  onClick={() => setSelectedChainId(chain.id)}
                  style={{ animationDelay: `${index * 50}ms` }}
                  type="button"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.22em] text-stone-500">
                        {chain.level} department
                      </p>
                      <h3 className="mt-2 text-xl font-semibold text-slate-950">
                        {chain.department}
                      </h3>
                    </div>
                    <ChainStatusBadge status={chain.status} />
                  </div>
                  <p className="mt-3 text-sm leading-6 text-stone-600">
                    {chain.summary}
                  </p>
                  <div className="mt-4 flex items-center justify-between gap-3 text-xs uppercase tracking-[0.18em] text-stone-500">
                    <span>{chain.updatedAt}</span>
                    <span className="inline-flex items-center gap-1">
                      Edit concept
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        <section className="grid gap-6 2xl:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <article className="rounded-[1.75rem] border border-stone-200 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-stone-500">
                    Chain editor
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                    {selectedChain.name}
                  </h2>
                </div>
                <ChainStatusBadge status={selectedChain.status} />
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <MockField label="Chain name" value={selectedChain.name} />
                <MockField label="Department" value={selectedChain.department} />
                <MockField label="School level" value={selectedChain.level} />
                <MockField
                  label="Routing mode"
                  value={selectedChain.customRouting ? "Custom department chain" : "V1 fallback equivalent"}
                />
              </div>
            </article>

            <article className="rounded-[1.75rem] border border-stone-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-stone-500">
                    Approval steps
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                    Ordered workflow
                  </h2>
                </div>
                <Button type="button" variant="outline" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add step
                </Button>
              </div>

              <div className="mt-5 space-y-4">
                {selectedChain.steps.map((step, index) => (
                  <div
                    className="animate-in fade-in-0 slide-in-from-bottom-2 rounded-[1.5rem] border border-stone-200 bg-[linear-gradient(180deg,_#ffffff_0%,_#fafaf9_100%)] p-5 shadow-sm transition-all duration-300 hover:border-stone-300"
                    key={step.id}
                    style={{ animationDelay: `${index * 60}ms` }}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-950 text-sm font-semibold text-white">
                          {step.stepNumber}
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-[0.22em] text-stone-500">
                            Step {step.stepNumber}
                          </p>
                          <p className="mt-1 text-lg font-semibold text-slate-950">
                            {step.label}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <GhostControl icon={ChevronUp} label="Move up" />
                        <GhostControl icon={MoveDown} label="Move down" />
                        <GhostControl icon={ChevronDown} label="More" />
                      </div>
                    </div>

                    <div className="mt-5 grid gap-4 md:grid-cols-2">
                      <MockField
                        label="Source type"
                        value={formatSourceType(step.sourceType)}
                      />
                      <MockField label="Resolver" value={step.resolver} />
                      <MockField
                        label="Step mode"
                        value={step.isBlocking ? "Blocking approval step" : "CC only"}
                      />
                      <MockField label="Resolved preview" value={step.resolvedUser} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <Button type="button">Save draft</Button>
                <Button type="button" variant="outline">
                  Preview resolved chain
                </Button>
                <Button type="button" variant="ghost">
                  Activate chain
                </Button>
              </div>
            </article>
          </div>

          <div className="space-y-6">
            <article className="rounded-[1.75rem] border border-stone-200 bg-white p-6 shadow-sm">
              <p className="text-xs uppercase tracking-[0.24em] text-stone-500">
                Resolved preview
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                Who this goes to
              </h2>
              <div className="mt-5 space-y-3">
                {selectedChain.steps.map((step, index) => (
                  <div
                    className="animate-in fade-in-0 slide-in-from-right-2 rounded-2xl border border-stone-200 bg-stone-50 px-4 py-4"
                    key={`${step.id}-preview`}
                    style={{ animationDelay: `${index * 70}ms` }}
                  >
                    <p className="text-xs uppercase tracking-[0.18em] text-stone-500">
                      Step {step.stepNumber}
                    </p>
                    <p className="mt-1 font-semibold text-slate-950">{step.label}</p>
                    <p className="mt-2 text-sm text-stone-600">{step.resolvedUser}</p>
                  </div>
                ))}
                <div className="rounded-2xl border border-sky-200 bg-sky-50/80 px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-sky-700">
                    CC
                  </p>
                  <p className="mt-1 font-semibold text-slate-950">
                    Facilities Director
                  </p>
                  <p className="mt-2 text-sm text-stone-600">
                    Kept outside the editable chain in this V2 concept.
                  </p>
                </div>
              </div>
            </article>

            <article className="rounded-[1.75rem] border border-stone-200 bg-white p-6 shadow-sm">
              <p className="text-xs uppercase tracking-[0.24em] text-stone-500">
                Validation
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                Safe-to-save checks
              </h2>
              <div className="mt-5 space-y-3">
                {selectedChain.validations.map((item, index) => (
                  <div
                    className={cn(
                      "animate-in fade-in-0 slide-in-from-bottom-2 rounded-2xl border px-4 py-4",
                      item.tone === "success"
                        ? "border-emerald-200 bg-emerald-50/80"
                        : "border-amber-200 bg-amber-50/80",
                    )}
                    key={item.id}
                    style={{ animationDelay: `${index * 70}ms` }}
                  >
                    <div className="flex items-start gap-3">
                      {item.tone === "success" ? (
                        <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-700" />
                      ) : (
                        <TriangleAlert className="mt-0.5 h-4 w-4 text-amber-800" />
                      )}
                      <p className="text-sm leading-6 text-slate-900">{item.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-[1.75rem] border border-stone-200 bg-[linear-gradient(180deg,_#0f172a_0%,_#111827_100%)] p-6 text-white shadow-sm">
              <p className="text-xs uppercase tracking-[0.24em] text-amber-200/80">
                V1 fallback
              </p>
              <h2 className="mt-2 text-2xl font-semibold">
                Current safe default
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                If this chain is disabled or incomplete, the current department
                fallback remains:
              </p>
              <div className="mt-4 rounded-2xl bg-white/10 px-4 py-4 text-sm text-slate-100">
                Department Head {"->"}{" "}
                {selectedChain.level === "MS" ? "MS Principal" : "HS Principal"}
              </div>
            </article>
          </div>
        </section>
      </section>
    </div>
  );
}

function MockFilter({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
        {label}
      </p>
      <div className="flex h-12 items-center rounded-2xl border border-stone-300 bg-stone-50 px-4 text-sm text-stone-600">
        {value}
      </div>
    </div>
  );
}

function MockField({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
        {label}
      </p>
      <div className="flex min-h-12 items-center rounded-2xl border border-stone-300 bg-stone-50 px-4 py-3 text-sm text-slate-900">
        {value}
      </div>
    </div>
  );
}

function GhostControl({
  icon: Icon,
  label,
}: {
  icon: typeof ChevronUp;
  label: string;
}) {
  return (
    <button
      className="inline-flex items-center gap-2 rounded-full border border-stone-200 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-stone-600 transition hover:border-stone-300 hover:bg-stone-50"
      type="button"
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}

function ChainStatusBadge({ status }: { status: ChainStatus }) {
  const classes =
    status === "active"
      ? "border-emerald-200 bg-emerald-50 text-emerald-900"
      : status === "draft"
        ? "border-stone-200 bg-stone-100 text-stone-700"
        : "border-amber-200 bg-amber-50 text-amber-950";

  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]",
        classes,
      )}
    >
      {status === "attention" ? "Needs attention" : status}
    </span>
  );
}

function formatSourceType(sourceType: StepSource) {
  if (sourceType === "entity_head") {
    return "Entity head";
  }

  if (sourceType === "specific_user") {
    return "Specific user";
  }

  return "Title lookup";
}
