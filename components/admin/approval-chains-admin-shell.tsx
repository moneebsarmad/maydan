"use client";

import type { Dispatch, SetStateAction } from "react";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  Layers3,
  Plus,
  RotateCcw,
  Save,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";
import {
  deactivateDepartmentApprovalChainAction,
  upsertDepartmentApprovalChainAction,
} from "@/app/(dashboard)/admin/actions";
import { AdminNav } from "@/components/admin/admin-nav";
import { EmptyState } from "@/components/shared/empty-state";
import { FormError } from "@/components/shared/form-error";
import { LoadingLabel } from "@/components/shared/loading-label";
import { AppToast } from "@/components/shared/toast";
import { ConfirmModal } from "@/components/shared/confirm-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  buildDefaultDepartmentChainName,
  buildFallbackDepartmentChainSummary,
  summarizeDepartmentChainLabels,
  type DepartmentApprovalChainEditorStep,
  type DepartmentChainGradeLevel,
} from "@/lib/approval-chains/department-approval-chain-utils";
import {
  approvalChainStepSourceOptions,
  type DepartmentApprovalChainFormValues,
} from "@/lib/utils/admin-forms";
import { cn } from "@/lib/utils";
import type { ApprovalChainStepSource, GradeLevel } from "@/types";

interface ApprovalChainsAdminShellProps {
  slots: DepartmentChainSlot[];
  approverUsers: ApproverOption[];
}

interface DepartmentChainSlot {
  slotId: string;
  entityId: string;
  departmentName: string;
  entityGradeLevel: GradeLevel | null;
  gradeLevel: DepartmentChainGradeLevel;
  headUserId: string | null;
  headUserName: string;
  template: {
    id: string;
    name: string;
    active: boolean;
    updatedAt: string | null;
    steps: ChainTemplateStep[];
  } | null;
}

interface ChainTemplateStep {
  id: string;
  sourceType: ApprovalChainStepSource;
  userId: string | null;
  titleKey: string | null;
  labelOverride: string | null;
  isBlocking: boolean;
}

interface ApproverOption {
  id: string;
  name: string;
  title: string | null;
}

interface TitleOption {
  value: string;
  count: number;
  resolvedUserName: string | null;
}

interface EditorState {
  templateId?: string;
  name: string;
  active: boolean;
  steps: DepartmentApprovalChainEditorStep[];
}

interface ResolvedStepPreview {
  label: string;
  resolution: string;
  warning: string | null;
}

type SlotFilter = "all" | "custom" | "fallback" | "attention";

const maxSteps = 5;

export function ApprovalChainsAdminShell({
  slots,
  approverUsers,
}: ApprovalChainsAdminShellProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [gradeFilter, setGradeFilter] = useState<"all" | DepartmentChainGradeLevel>(
    "all",
  );
  const [statusFilter, setStatusFilter] = useState<SlotFilter>("all");
  const [selectedSlotId, setSelectedSlotId] = useState(slots[0]?.slotId ?? "");
  const [editorState, setEditorState] = useState<EditorState | null>(
    slots[0] ? buildEditorState(slots[0]) : null,
  );
  const [toast, setToast] = useState<{
    title: string;
    description: string;
    variant: "success" | "error" | "info";
  } | null>(null);
  const [confirmDeactivateOpen, setConfirmDeactivateOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const titleOptions = useMemo(() => buildTitleOptions(approverUsers), [approverUsers]);
  const slotInsights = useMemo(
    () =>
      new Map(
        slots.map((slot) => [
          slot.slotId,
          buildSlotInsight(slot, approverUsers, titleOptions),
        ]),
      ),
    [approverUsers, slots, titleOptions],
  );

  const filteredSlots = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return slots.filter((slot) => {
      const insight = slotInsights.get(slot.slotId);
      const matchesSearch =
        !normalizedSearch ||
        slot.departmentName.toLowerCase().includes(normalizedSearch) ||
        slot.gradeLevel.toLowerCase().includes(normalizedSearch) ||
        insight?.summary.toLowerCase().includes(normalizedSearch);
      const matchesGrade =
        gradeFilter === "all" || slot.gradeLevel === gradeFilter;
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "custom" && insight?.mode === "custom") ||
        (statusFilter === "fallback" && insight?.mode === "fallback") ||
        (statusFilter === "attention" && (insight?.warnings.length ?? 0) > 0);

      return matchesSearch && matchesGrade && matchesStatus;
    });
  }, [gradeFilter, search, slotInsights, slots, statusFilter]);

  useEffect(() => {
    if (!filteredSlots.length) {
      if (slots.length && !selectedSlotId) {
        setSelectedSlotId(slots[0].slotId);
      }
      return;
    }

    if (!filteredSlots.some((slot) => slot.slotId === selectedSlotId)) {
      setSelectedSlotId(filteredSlots[0].slotId);
    }
  }, [filteredSlots, selectedSlotId, slots]);

  const selectedSlot =
    filteredSlots.find((slot) => slot.slotId === selectedSlotId) ??
    slots.find((slot) => slot.slotId === selectedSlotId) ??
    filteredSlots[0] ??
    slots[0] ??
    null;

  const selectedSlotResetKey = `${selectedSlot?.slotId ?? "none"}:${selectedSlot?.template?.id ?? "fallback"}:${selectedSlot?.template?.updatedAt ?? "none"}:${selectedSlot?.template?.active ?? "fallback"}`;

  useEffect(() => {
    if (!selectedSlot) {
      setEditorState(null);
      return;
    }

    setEditorState(buildEditorState(selectedSlot));
  }, [selectedSlot, selectedSlotResetKey]);

  const editorPreview = useMemo(() => {
    if (!selectedSlot || !editorState) {
      return {
        summary: "",
        steps: [] as ResolvedStepPreview[],
        warnings: [] as string[],
      };
    }

    return buildEditorPreview(
      selectedSlot,
      editorState.steps,
      approverUsers,
      titleOptions,
    );
  }, [approverUsers, editorState, selectedSlot, titleOptions]);

  const summaryCards = useMemo(() => {
    const totalRoutes = slots.length;
    const customRoutes = Array.from(slotInsights.values()).filter(
      (insight) => insight.mode === "custom",
    ).length;
    const fallbackRoutes = totalRoutes - customRoutes;
    const attentionRoutes = Array.from(slotInsights.values()).filter(
      (insight) => insight.warnings.length > 0,
    ).length;

    return [
      {
        label: "Department Slots",
        value: `${totalRoutes}`,
        detail: "Each department/grade slot can run the V1 fallback or a custom chain.",
        icon: Layers3,
      },
      {
        label: "Custom Active",
        value: `${customRoutes}`,
        detail: "Department slots currently using a saved live custom chain.",
        icon: ShieldCheck,
      },
      {
        label: "Fallback Live",
        value: `${fallbackRoutes}`,
        detail: "Slots still resolving through the original V1 department path.",
        icon: CheckCircle2,
      },
      {
        label: "Needs Review",
        value: `${attentionRoutes}`,
        detail: "Live chain slots with unresolved or ambiguous approver mapping.",
        icon: TriangleAlert,
      },
    ];
  }, [slotInsights, slots.length]);

  if (!slots.length) {
    return (
      <div className="space-y-6">
        <section>
          <p className="text-xs uppercase tracking-[0.28em] text-stone-500">
            Admin
          </p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight text-slate-950">
            Department approval chains
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-stone-600">
            Custom routing can be assigned per department and grade level once
            department entities exist.
          </p>
        </section>

        <AdminNav />

        <EmptyState
          title="No departments found"
          description="Create department entities first, then configure their approval chains here."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-stone-200 bg-[linear-gradient(135deg,_#ffffff_0%,_#f8fafc_52%,_#f5f5f4_100%)] p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.32em] text-stone-500">
              Admin
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">
              Department approval chains
            </h1>
            <p className="mt-3 max-w-3xl text-base leading-7 text-stone-600">
              Configure real department-only approval chains with ordered
              approvers, live validation, and automatic fallback to the V1
              routing matrix when a custom chain is inactive.
            </p>
          </div>
          <div className="rounded-full border border-amber-300 bg-amber-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-amber-950">
            Facilities Director remains auto-CC&apos;d
          </div>
        </div>
      </section>

      <AdminNav />

      {toast ? (
        <AppToast
          title={toast.title}
          description={toast.description}
          variant={toast.variant}
        />
      ) : null}

      <section className="grid gap-4 lg:grid-cols-4">
        {summaryCards.map((card) => {
          const Icon = card.icon;

          return (
            <article
              className="rounded-[1.75rem] border border-stone-200 bg-white p-5 shadow-sm"
              key={card.label}
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs uppercase tracking-[0.24em] text-stone-500">
                  {card.label}
                </p>
                <Icon className="h-4 w-4 text-amber-700" />
              </div>
              <p className="mt-4 text-4xl font-semibold tracking-tight text-slate-950">
                {card.value}
              </p>
              <p className="mt-2 text-sm leading-6 text-stone-600">
                {card.detail}
              </p>
            </article>
          );
        })}
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.88fr_1.45fr]">
        <aside className="space-y-4">
          <div className="rounded-[1.75rem] border border-stone-200 bg-white p-5 shadow-sm">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-stone-500">
                Route finder
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                Department slots
              </h2>
            </div>

            <div className="mt-5 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="approval-chain-search">Search</Label>
                <Input
                  id="approval-chain-search"
                  placeholder="English, Quran, HS..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="approval-chain-grade">Grade</Label>
                  <select
                    className="h-12 w-full rounded-2xl border border-stone-300 px-4 text-sm text-slate-950 shadow-sm"
                    id="approval-chain-grade"
                    value={gradeFilter}
                    onChange={(event) =>
                      setGradeFilter(
                        event.target.value as "all" | DepartmentChainGradeLevel,
                      )
                    }
                  >
                    <option value="all">All grades</option>
                    <option value="HS">HS</option>
                    <option value="MS">MS</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="approval-chain-status">Status</Label>
                  <select
                    className="h-12 w-full rounded-2xl border border-stone-300 px-4 text-sm text-slate-950 shadow-sm"
                    id="approval-chain-status"
                    value={statusFilter}
                    onChange={(event) =>
                      setStatusFilter(event.target.value as SlotFilter)
                    }
                  >
                    <option value="all">All statuses</option>
                    <option value="custom">Custom active</option>
                    <option value="fallback">Fallback live</option>
                    <option value="attention">Needs review</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {filteredSlots.length ? (
            <div className="space-y-3">
              {filteredSlots.map((slot) => {
                const insight = slotInsights.get(slot.slotId);
                const isSelected = slot.slotId === selectedSlot?.slotId;

                return (
                  <button
                    className={cn(
                      "w-full rounded-[1.75rem] border bg-white p-5 text-left shadow-sm transition-all duration-300",
                      isSelected
                        ? "border-amber-300 ring-2 ring-amber-200/70"
                        : "border-stone-200 hover:-translate-y-0.5 hover:border-stone-300 hover:shadow-md",
                    )}
                    key={slot.slotId}
                    onClick={() => setSelectedSlotId(slot.slotId)}
                    type="button"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.24em] text-stone-500">
                          {slot.gradeLevel} department slot
                        </p>
                        <h3 className="mt-2 text-xl font-semibold text-slate-950">
                          {slot.departmentName}
                        </h3>
                      </div>
                      <span
                        className={cn(
                          "rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]",
                          insight?.mode === "custom"
                            ? "bg-emerald-100 text-emerald-950"
                            : "bg-stone-100 text-stone-700",
                        )}
                      >
                        {insight?.mode === "custom" ? "Custom" : "Fallback"}
                      </span>
                    </div>

                    <p className="mt-3 text-sm leading-6 text-stone-600">
                      {insight?.summary}
                    </p>
                    <p className="mt-2 text-sm text-stone-500">
                      Head approver: {slot.headUserName}
                    </p>

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      {slot.template?.updatedAt ? (
                        <span className="rounded-full bg-stone-100 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-stone-700">
                          Updated {formatRelativeDate(slot.template.updatedAt)}
                        </span>
                      ) : null}
                      {(insight?.warnings.length ?? 0) > 0 ? (
                        <span className="rounded-full bg-amber-100 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-amber-950">
                          {insight?.warnings.length} warning
                          {(insight?.warnings.length ?? 0) === 1 ? "" : "s"}
                        </span>
                      ) : (
                        <span className="rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-emerald-950">
                          Live chain resolves
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <EmptyState
              title="No department slots match those filters"
              description="Adjust the search, grade, or status filters to find a department chain slot."
            />
          )}
        </aside>

        {selectedSlot && editorState ? (
          <section className="space-y-4">
            <div className="rounded-[1.75rem] border border-stone-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-stone-500">
                    Editing
                  </p>
                  <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
                    {selectedSlot.departmentName}
                  </h2>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-600">
                    Grade level: {selectedSlot.gradeLevel}. Entity head:{" "}
                    {selectedSlot.headUserName}. Live routing is currently{" "}
                    {slotInsights.get(selectedSlot.slotId)?.mode === "custom"
                      ? "using this custom chain."
                      : "falling back to the V1 department path."}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <span
                    className={cn(
                      "rounded-full px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.16em]",
                      slotInsights.get(selectedSlot.slotId)?.mode === "custom"
                        ? "bg-emerald-100 text-emerald-950"
                        : "bg-stone-100 text-stone-700",
                    )}
                  >
                    {slotInsights.get(selectedSlot.slotId)?.mode === "custom"
                      ? "Custom active"
                      : "V1 fallback live"}
                  </span>
                  <span className="rounded-full bg-amber-100 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-950">
                    Facilities Director CC
                  </span>
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-[1.3fr_0.8fr]">
                <div className="space-y-2">
                  <Label htmlFor="chain-name">Chain name</Label>
                  <Input
                    id="chain-name"
                    value={editorState.name}
                    onChange={(event) =>
                      setEditorState((current) =>
                        current
                          ? {
                              ...current,
                              name: event.target.value,
                            }
                          : current,
                      )
                    }
                  />
                </div>

                <label className="flex items-center gap-3 rounded-[1.5rem] border border-stone-200 bg-stone-50 px-4 py-3">
                  <input
                    checked={editorState.active}
                    className="h-4 w-4 rounded border-stone-300"
                    onChange={(event) =>
                      setEditorState((current) =>
                        current
                          ? {
                              ...current,
                              active: event.target.checked,
                            }
                          : current,
                      )
                    }
                    type="checkbox"
                  />
                  <div>
                    <p className="text-sm font-semibold text-slate-950">
                      Activate custom chain
                    </p>
                    <p className="text-xs leading-5 text-stone-500">
                      Disable this to keep the saved chain but run live routing
                      through the V1 fallback.
                    </p>
                  </div>
                </label>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <Button
                  disabled={isPending}
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setToast(null);
                    setEditorState(buildFallbackEditorState(selectedSlot));
                  }}
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Use fallback blueprint
                </Button>

                {selectedSlot.template ? (
                  <Button
                    disabled={isPending}
                    type="button"
                    variant="ghost"
                    onClick={() => setConfirmDeactivateOpen(true)}
                  >
                    Deactivate custom chain
                  </Button>
                ) : null}

                <Button
                  disabled={isPending}
                  type="button"
                  onClick={() => {
                    setToast(null);

                    startTransition(async () => {
                      const result = await upsertDepartmentApprovalChainAction({
                        templateId: editorState.templateId,
                        name: editorState.name,
                        entityId: selectedSlot.entityId,
                        gradeLevel: selectedSlot.gradeLevel,
                        active: editorState.active,
                        steps: editorState.steps,
                      } satisfies DepartmentApprovalChainFormValues);

                      if (!result.success) {
                        setToast({
                          title: "Save failed",
                          description: result.error,
                          variant: "error",
                        });
                        return;
                      }

                      setToast({
                        title: "Chain saved",
                        description: result.message,
                        variant: "success",
                      });
                      router.refresh();
                    });
                  }}
                >
                  {isPending ? (
                    <LoadingLabel label="Saving..." />
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save chain
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-stone-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-stone-500">
                    Ordered approvers
                  </p>
                  <h3 className="mt-2 text-2xl font-semibold text-slate-950">
                    Step editor
                  </h3>
                </div>

                <Button
                  disabled={editorState.steps.length >= maxSteps || isPending}
                  type="button"
                  variant="outline"
                  onClick={() => {
                    if (editorState.steps.length >= maxSteps) {
                      setToast({
                        title: "Step limit reached",
                        description:
                          "Keep department approval chains to five steps or fewer.",
                        variant: "info",
                      });
                      return;
                    }

                    setEditorState((current) =>
                      current
                        ? {
                            ...current,
                            steps: [
                              ...current.steps,
                              {
                                sourceType: "specific_user",
                              },
                            ],
                          }
                        : current,
                    );
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add step
                </Button>
              </div>

              <div className="mt-5 space-y-4">
                {editorState.steps.map((step, index) => {
                  const stepPreview = editorPreview.steps[index];

                  return (
                    <article
                      className="rounded-[1.5rem] border border-stone-200 bg-stone-50 p-5"
                      key={step.id ?? `${step.sourceType}-${index}`}
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <p className="text-xs uppercase tracking-[0.24em] text-stone-500">
                            Step {index + 1}
                          </p>
                          <h4 className="mt-2 text-xl font-semibold text-slate-950">
                            {stepPreview?.label ?? `Step ${index + 1}`}
                          </h4>
                          <p className="mt-2 text-sm text-stone-600">
                            {stepPreview?.resolution ?? "Configure how this approver resolves."}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <Button
                            disabled={index === 0 || isPending}
                            size="icon"
                            type="button"
                            variant="outline"
                            onClick={() => moveStep(index, "up", setEditorState)}
                          >
                            <ArrowUp className="h-4 w-4" />
                          </Button>
                          <Button
                            disabled={index === editorState.steps.length - 1 || isPending}
                            size="icon"
                            type="button"
                            variant="outline"
                            onClick={() => moveStep(index, "down", setEditorState)}
                          >
                            <ArrowDown className="h-4 w-4" />
                          </Button>
                          <Button
                            disabled={editorState.steps.length === 1 || isPending}
                            size="sm"
                            type="button"
                            variant="ghost"
                            onClick={() =>
                              setEditorState((current) =>
                                current
                                  ? {
                                      ...current,
                                      steps: current.steps.filter(
                                        (_currentStep, currentIndex) =>
                                          currentIndex !== index,
                                      ),
                                    }
                                  : current,
                              )
                            }
                          >
                            Remove
                          </Button>
                        </div>
                      </div>

                      <div className="mt-5 grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor={`source-type-${index}`}>Source type</Label>
                          <select
                            className="h-12 w-full rounded-2xl border border-stone-300 px-4 text-sm text-slate-950 shadow-sm"
                            id={`source-type-${index}`}
                            value={step.sourceType}
                            onChange={(event) =>
                              updateStep(index, {
                                sourceType: event.target.value as ApprovalChainStepSource,
                                userId: undefined,
                                titleKey: undefined,
                              })
                            }
                          >
                            {approvalChainStepSourceOptions.map((option) => (
                              <option key={option} value={option}>
                                {formatStepSourceLabel(option)}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`label-override-${index}`}>
                            Step label override
                          </Label>
                          <Input
                            id={`label-override-${index}`}
                            placeholder="Optional label shown to admins"
                            value={step.labelOverride ?? ""}
                            onChange={(event) =>
                              updateStep(index, {
                                labelOverride: normalizeOptionalValue(
                                  event.target.value,
                                ),
                              })
                            }
                          />
                        </div>
                      </div>

                      {step.sourceType === "specific_user" ? (
                        <div className="mt-4 space-y-2">
                          <Label htmlFor={`specific-user-${index}`}>Approver</Label>
                          <select
                            className="h-12 w-full rounded-2xl border border-stone-300 px-4 text-sm text-slate-950 shadow-sm"
                            id={`specific-user-${index}`}
                            value={step.userId ?? ""}
                            onChange={(event) =>
                              updateStep(index, {
                                userId: normalizeOptionalValue(event.target.value),
                              })
                            }
                          >
                            <option value="">Select an approver</option>
                            {approverUsers.map((user) => (
                              <option key={user.id} value={user.id}>
                                {user.name}
                                {user.title ? ` (${user.title})` : ""}
                              </option>
                            ))}
                          </select>
                          <FormError message={stepPreview?.warning ?? undefined} />
                        </div>
                      ) : null}

                      {step.sourceType === "title_lookup" ? (
                        <div className="mt-4 space-y-2">
                          <Label htmlFor={`title-lookup-${index}`}>Lookup title</Label>
                          <select
                            className="h-12 w-full rounded-2xl border border-stone-300 px-4 text-sm text-slate-950 shadow-sm"
                            id={`title-lookup-${index}`}
                            value={step.titleKey ?? ""}
                            onChange={(event) =>
                              updateStep(index, {
                                titleKey: normalizeOptionalValue(event.target.value),
                              })
                            }
                          >
                            <option value="">Select a title</option>
                            {titleOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.value}
                                {option.count === 1 && option.resolvedUserName
                                  ? ` (${option.resolvedUserName})`
                                  : ` (${option.count} matches)`}
                              </option>
                            ))}
                          </select>
                          <FormError message={stepPreview?.warning ?? undefined} />
                        </div>
                      ) : null}

                      {step.sourceType === "entity_head" ? (
                        <div className="mt-4 rounded-[1.25rem] border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700">
                          This step resolves to the department&apos;s assigned
                          head user:{" "}
                          <span className="font-semibold text-slate-950">
                            {selectedSlot.headUserName}
                          </span>
                        </div>
                      ) : null}
                    </article>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
              <article className="rounded-[1.75rem] border border-stone-200 bg-white p-6 shadow-sm">
                <p className="text-xs uppercase tracking-[0.24em] text-stone-500">
                  Live preview
                </p>
                <h3 className="mt-2 text-2xl font-semibold text-slate-950">
                  {editorPreview.summary}
                </h3>
                <div className="mt-5 space-y-3">
                  {editorPreview.steps.map((step, index) => (
                    <div
                      className="rounded-[1.25rem] border border-stone-200 bg-stone-50 px-4 py-3"
                      key={`${step.label}-${index}`}
                    >
                      <p className="text-xs uppercase tracking-[0.22em] text-stone-500">
                        Step {index + 1}
                      </p>
                      <p className="mt-2 font-semibold text-slate-950">
                        {step.label}
                      </p>
                      <p className="mt-1 text-sm text-stone-600">
                        {step.resolution}
                      </p>
                    </div>
                  ))}
                </div>
              </article>

              <article className="rounded-[1.75rem] border border-stone-200 bg-white p-6 shadow-sm">
                <p className="text-xs uppercase tracking-[0.24em] text-stone-500">
                  Validation
                </p>
                <h3 className="mt-2 text-2xl font-semibold text-slate-950">
                  Routing checks
                </h3>
                {editorPreview.warnings.length ? (
                  <div className="mt-5 space-y-3">
                    {editorPreview.warnings.map((warning) => (
                      <div
                        className="rounded-[1.25rem] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"
                        key={warning}
                      >
                        {warning}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-5 rounded-[1.25rem] border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-950">
                    This editor state resolves cleanly. Saving it will produce a
                    live department chain, and Facilities Director will still be
                    copied outside the blocking steps.
                  </div>
                )}
              </article>
            </div>
          </section>
        ) : (
          <EmptyState
            title="Select a department slot"
            description="Choose a department and grade-level slot on the left to configure its approval chain."
          />
        )}
      </section>

      <ConfirmModal
        cancelLabel="Keep active"
        confirmLabel="Deactivate chain"
        description="This will keep the saved custom chain on record, but live routing for this slot will immediately fall back to the V1 department path."
        open={confirmDeactivateOpen}
        title="Deactivate custom department chain?"
        onCancel={() => setConfirmDeactivateOpen(false)}
        onConfirm={() => {
          if (!selectedSlot?.template) {
            setConfirmDeactivateOpen(false);
            return;
          }

          setToast(null);
          setConfirmDeactivateOpen(false);

          startTransition(async () => {
            const result = await deactivateDepartmentApprovalChainAction({
              templateId: selectedSlot.template?.id,
            });

            if (!result.success) {
              setToast({
                title: "Deactivate failed",
                description: result.error,
                variant: "error",
              });
              return;
            }

            setToast({
              title: "Custom chain disabled",
              description: result.message,
              variant: "success",
            });
            router.refresh();
          });
        }}
      />
    </div>
  );

  function updateStep(
    index: number,
    patch: Partial<DepartmentApprovalChainEditorStep>,
  ) {
    setEditorState((current) =>
      current
        ? {
            ...current,
            steps: current.steps.map((step, stepIndex) =>
              stepIndex === index ? { ...step, ...patch } : step,
            ),
          }
        : current,
    );
  }
}

function buildEditorState(slot: DepartmentChainSlot): EditorState {
  if (!slot.template) {
    return buildFallbackEditorState(slot);
  }

  return {
    templateId: slot.template.id,
    name: slot.template.name,
    active: slot.template.active,
    steps: slot.template.steps.map((step) => ({
      id: step.id,
      sourceType: step.sourceType,
      userId: step.userId ?? undefined,
      titleKey: step.titleKey ?? undefined,
      labelOverride: step.labelOverride ?? undefined,
    })),
  };
}

function buildFallbackEditorState(slot: DepartmentChainSlot): EditorState {
  return {
    name: buildDefaultDepartmentChainName(slot.departmentName, slot.gradeLevel),
    active: true,
    steps: getFallbackSteps(slot.gradeLevel),
  };
}

function getFallbackSteps(
  gradeLevel: DepartmentChainGradeLevel,
): DepartmentApprovalChainEditorStep[] {
  return [
    {
      sourceType: "entity_head",
      labelOverride: "Department Head",
    },
    {
      sourceType: "title_lookup",
      titleKey: gradeLevel === "MS" ? "MS Principal" : "HS Principal",
      labelOverride: gradeLevel === "MS" ? "MS Principal" : "HS Principal",
    },
  ];
}

function buildSlotInsight(
  slot: DepartmentChainSlot,
  approverUsers: ApproverOption[],
  titleOptions: TitleOption[],
) {
  const activeSteps =
    slot.template?.active && slot.template.steps.length
      ? slot.template.steps.map((step) => ({
          sourceType: step.sourceType,
          userId: step.userId ?? undefined,
          titleKey: step.titleKey ?? undefined,
          labelOverride: step.labelOverride ?? undefined,
        }))
      : getFallbackSteps(slot.gradeLevel);
  const preview = buildEditorPreview(slot, activeSteps, approverUsers, titleOptions);

  return {
    mode: slot.template?.active ? ("custom" as const) : ("fallback" as const),
    summary: preview.summary || buildFallbackDepartmentChainSummary(slot.gradeLevel),
    warnings: preview.warnings,
  };
}

function buildEditorPreview(
  slot: DepartmentChainSlot,
  steps: DepartmentApprovalChainEditorStep[],
  approverUsers: ApproverOption[],
  titleOptions: TitleOption[],
) {
  const resolvedSteps = steps.map((step) =>
    resolveStepPreview(step, slot, approverUsers, titleOptions),
  );

  return {
    summary: summarizeDepartmentChainLabels(
      resolvedSteps.map((step) => step.label),
      slot.gradeLevel,
    ),
    steps: resolvedSteps,
    warnings: resolvedSteps
      .map((step) => step.warning)
      .filter((warning): warning is string => Boolean(warning)),
  };
}

function resolveStepPreview(
  step: DepartmentApprovalChainEditorStep,
  slot: DepartmentChainSlot,
  approverUsers: ApproverOption[],
  titleOptions: TitleOption[],
): ResolvedStepPreview {
  if (step.sourceType === "entity_head") {
    return {
      label: step.labelOverride?.trim() || "Department Head",
      resolution: `Resolves to ${slot.headUserName}.`,
      warning:
        slot.headUserId && slot.headUserName !== "Unassigned"
          ? null
          : `${slot.departmentName} does not have a department head assigned.`,
    };
  }

  if (step.sourceType === "specific_user") {
    const user = approverUsers.find((candidate) => candidate.id === step.userId);

    return {
      label:
        step.labelOverride?.trim() ||
        user?.title ||
        user?.name ||
        "Specific approver",
      resolution: user
        ? `Resolves to ${user.name}${user.title ? ` (${user.title})` : ""}.`
        : "Select an active admin or approver account.",
      warning: user ? null : "A specific-user step must target an active admin or approver.",
    };
  }

  const selectedTitle = titleOptions.find((option) => option.value === step.titleKey);
  const fallbackLabel = step.titleKey?.trim() || "Title lookup";

  return {
    label: step.labelOverride?.trim() || fallbackLabel,
    resolution: selectedTitle
      ? selectedTitle.count === 1 && selectedTitle.resolvedUserName
        ? `Resolves to ${selectedTitle.resolvedUserName} via the "${selectedTitle.value}" title.`
        : `Currently resolves to ${selectedTitle.count} matching users with the "${selectedTitle.value}" title.`
      : 'Select a title that resolves to exactly one active admin or approver.',
    warning:
      !step.titleKey
        ? "A title-lookup step needs a title."
        : !selectedTitle
          ? `No active admin or approver currently has the "${step.titleKey}" title.`
          : selectedTitle.count !== 1
            ? `The "${selectedTitle.value}" title resolves to ${selectedTitle.count} users. It must resolve to exactly one.`
            : null,
  };
}

function buildTitleOptions(users: ApproverOption[]): TitleOption[] {
  const counts = new Map<
    string,
    { count: number; resolvedUserName: string | null }
  >();

  for (const user of users) {
    const title = user.title?.trim();

    if (!title) {
      continue;
    }

    const current = counts.get(title);

    if (!current) {
      counts.set(title, {
        count: 1,
        resolvedUserName: user.name,
      });
      continue;
    }

    counts.set(title, {
      count: current.count + 1,
      resolvedUserName: null,
    });
  }

  return Array.from(counts.entries())
    .map(([value, meta]) => ({
      value,
      count: meta.count,
      resolvedUserName: meta.count === 1 ? meta.resolvedUserName : null,
    }))
    .sort((left, right) => left.value.localeCompare(right.value));
}

function moveStep(
  index: number,
  direction: "up" | "down",
  setEditorState: Dispatch<SetStateAction<EditorState | null>>,
) {
  setEditorState((current) => {
    if (!current) {
      return current;
    }

    const nextIndex = direction === "up" ? index - 1 : index + 1;

    if (nextIndex < 0 || nextIndex >= current.steps.length) {
      return current;
    }

    const nextSteps = [...current.steps];
    const [movedStep] = nextSteps.splice(index, 1);
    nextSteps.splice(nextIndex, 0, movedStep);

    return {
      ...current,
      steps: nextSteps,
    };
  });
}

function formatStepSourceLabel(sourceType: ApprovalChainStepSource) {
  switch (sourceType) {
    case "entity_head":
      return "Department head";
    case "specific_user":
      return "Specific user";
    case "title_lookup":
      return "Title lookup";
    default: {
      const exhaustiveCheck: never = sourceType;
      return exhaustiveCheck;
    }
  }
}

function formatRelativeDate(value: string) {
  const updatedAt = new Date(value);
  const diffMs = Date.now() - updatedAt.getTime();
  const diffHours = Math.max(1, Math.round(diffMs / (1000 * 60 * 60)));

  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  const diffDays = Math.max(1, Math.round(diffHours / 24));
  return `${diffDays}d ago`;
}

function normalizeOptionalValue(value: string) {
  const normalizedValue = value.trim();
  return normalizedValue ? normalizedValue : undefined;
}
