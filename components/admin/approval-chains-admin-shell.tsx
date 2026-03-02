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
  Save,
  ShieldAlert,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { upsertDepartmentApprovalChainAction } from "@/app/(dashboard)/admin/actions";
import { AdminNav } from "@/components/admin/admin-nav";
import { EmptyState } from "@/components/shared/empty-state";
import { FormError } from "@/components/shared/form-error";
import { LoadingLabel } from "@/components/shared/loading-label";
import { AppToast } from "@/components/shared/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  buildDefaultDepartmentChainName,
  summarizeDepartmentChainLabels,
  type DepartmentApprovalChainEditorStep,
  type DepartmentChainGradeLevel,
} from "@/lib/approval-chains/department-approval-chain-utils";
import type { DepartmentApprovalChainFormValues } from "@/lib/utils/admin-forms";
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
  steps: DepartmentApprovalChainEditorStep[];
}

interface ResolvedStepPreview {
  label: string;
  resolution: string;
  warning: string | null;
}

interface SlotInsight {
  configured: boolean;
  summary: string;
  warnings: string[];
}

interface DepartmentGroup {
  entityId: string;
  departmentName: string;
  slots: DepartmentChainSlot[];
  configuredCount: number;
  warningCount: number;
}

const maxSteps = 5;
const fixedPrincipalTitles = new Set(["HS Principal", "MS Principal"]);

export function ApprovalChainsAdminShell({
  slots,
  approverUsers,
}: ApprovalChainsAdminShellProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [selectedDepartmentId, setSelectedDepartmentId] = useState(
    slots[0]?.entityId ?? "",
  );
  const [selectedGradeLevel, setSelectedGradeLevel] =
    useState<DepartmentChainGradeLevel | null>(slots[0]?.gradeLevel ?? null);
  const [editorState, setEditorState] = useState<EditorState | null>(
    slots[0] ? buildEditorState(slots[0]) : null,
  );
  const [toast, setToast] = useState<{
    title: string;
    description: string;
    variant: "success" | "error" | "info";
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  const titleOptions = useMemo(() => buildTitleOptions(approverUsers), [approverUsers]);
  const customTitleOptions = useMemo(
    () =>
      titleOptions.filter((option) => !fixedPrincipalTitles.has(option.value)),
    [titleOptions],
  );

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

  const departments = useMemo(
    () => buildDepartmentGroups(slots, slotInsights),
    [slotInsights, slots],
  );

  const filteredDepartments = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return departments.filter((department) => {
      if (!normalizedSearch) {
        return true;
      }

      return department.departmentName.toLowerCase().includes(normalizedSearch);
    });
  }, [departments, search]);

  useEffect(() => {
    if (!filteredDepartments.length) {
      return;
    }

    if (
      !selectedDepartmentId ||
      !filteredDepartments.some(
        (department) => department.entityId === selectedDepartmentId,
      )
    ) {
      setSelectedDepartmentId(filteredDepartments[0].entityId);
    }
  }, [filteredDepartments, selectedDepartmentId]);

  const selectedDepartment =
    filteredDepartments.find(
      (department) => department.entityId === selectedDepartmentId,
    ) ??
    departments.find((department) => department.entityId === selectedDepartmentId) ??
    filteredDepartments[0] ??
    departments[0] ??
    null;

  useEffect(() => {
    if (!selectedDepartment?.slots.length) {
      setSelectedGradeLevel(null);
      return;
    }

    if (
      !selectedGradeLevel ||
      !selectedDepartment.slots.some(
        (slot) => slot.gradeLevel === selectedGradeLevel,
      )
    ) {
      setSelectedGradeLevel(selectedDepartment.slots[0].gradeLevel);
    }
  }, [selectedDepartment, selectedGradeLevel]);

  const selectedSlot =
    selectedDepartment?.slots.find(
      (slot) => slot.gradeLevel === selectedGradeLevel,
    ) ??
    selectedDepartment?.slots[0] ??
    null;

  const selectedSlotResetKey = `${selectedSlot?.slotId ?? "none"}:${selectedSlot?.template?.id ?? "none"}:${selectedSlot?.template?.updatedAt ?? "none"}:${selectedSlot?.template?.active ?? "none"}`;

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
    const configuredSlots = Array.from(slotInsights.values()).filter(
      (insight) => insight.configured,
    ).length;
    const warningCount = Array.from(slotInsights.values()).reduce(
      (total, insight) => total + insight.warnings.length,
      0,
    );

    return [
      {
        label: "Departments",
        value: `${departments.length}`,
        detail: "Select one department at a time and configure its grade-level chain.",
        icon: Layers3,
      },
      {
        label: "Configured Slots",
        value: `${configuredSlots}`,
        detail: "Department grade slots with a saved live custom chain.",
        icon: ShieldCheck,
      },
      {
        label: "Needs Setup",
        value: `${slots.length - configuredSlots}`,
        detail: "Slots without a saved chain. Department submissions are blocked there.",
        icon: ShieldAlert,
      },
      {
        label: "Open Warnings",
        value: `${warningCount}`,
        detail: "Resolution warnings across currently saved or starter chain states.",
        icon: CheckCircle2,
      },
    ];
  }, [departments.length, slotInsights, slots.length]);

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
            Create department entities first, then configure their custom chains
            here.
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
              Department routing is now fully custom. Each department grade slot
              needs a saved chain, and fixed steps like Department Head and the
              matching Principal stay compact to reduce visual noise.
            </p>
          </div>
          <div className="rounded-full border border-amber-300 bg-amber-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-amber-950">
            No V1 fallback for departments
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

      <section className="grid gap-6 xl:grid-cols-[0.72fr_1.48fr]">
        <aside className="space-y-4">
          <div className="rounded-[1.75rem] border border-stone-200 bg-white p-5 shadow-sm">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-stone-500">
                Choose department
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                Edit one at a time
              </h2>
            </div>

            <div className="mt-5 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="department-search">Search departments</Label>
                <Input
                  id="department-search"
                  placeholder="Arabic, English, Quran..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="department-select">Department</Label>
                <select
                  className="h-12 w-full rounded-2xl border border-stone-300 px-4 text-sm text-slate-950 shadow-sm"
                  id="department-select"
                  value={selectedDepartment?.entityId ?? ""}
                  onChange={(event) => setSelectedDepartmentId(event.target.value)}
                >
                  {filteredDepartments.map((department) => (
                    <option key={department.entityId} value={department.entityId}>
                      {department.departmentName}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {selectedDepartment ? (
            <>
              <div className="rounded-[1.75rem] border border-stone-200 bg-white p-5 shadow-sm">
                <p className="text-xs uppercase tracking-[0.24em] text-stone-500">
                  Selected department
                </p>
                <h3 className="mt-2 text-2xl font-semibold text-slate-950">
                  {selectedDepartment.departmentName}
                </h3>
                <p className="mt-3 text-sm leading-6 text-stone-600">
                  {selectedDepartment.configuredCount} configured slot
                  {selectedDepartment.configuredCount === 1 ? "" : "s"} and{" "}
                  {selectedDepartment.warningCount} warning
                  {selectedDepartment.warningCount === 1 ? "" : "s"} across its
                  active grade tabs.
                </p>

                <div className="mt-5 flex flex-wrap gap-3">
                  {selectedDepartment.slots.map((slot) => {
                    const insight = slotInsights.get(slot.slotId);
                    const isActive = slot.slotId === selectedSlot?.slotId;

                    return (
                      <button
                        className={cn(
                          "rounded-full border px-4 py-2 text-sm font-semibold transition",
                          isActive
                            ? "border-amber-300 bg-amber-100 text-amber-950"
                            : "border-stone-200 bg-white text-stone-700 hover:border-stone-300 hover:bg-stone-50",
                        )}
                        key={slot.slotId}
                        onClick={() => setSelectedGradeLevel(slot.gradeLevel)}
                        type="button"
                      >
                        {slot.gradeLevel}
                        <span className="ml-2 text-xs uppercase tracking-[0.14em]">
                          {insight?.configured ? "Ready" : "Setup"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {selectedSlot ? (
                <div className="rounded-[1.75rem] border border-stone-200 bg-white p-5 shadow-sm">
                  <p className="text-xs uppercase tracking-[0.24em] text-stone-500">
                    Current slot status
                  </p>
                  <h3 className="mt-2 text-2xl font-semibold text-slate-950">
                    {selectedSlot.gradeLevel} slot
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-stone-600">
                    {slotInsights.get(selectedSlot.slotId)?.configured
                      ? "This slot has a saved live chain."
                      : "This slot does not have a saved chain yet. Department submissions for this slot will fail until you save one."}
                  </p>

                  {(slotInsights.get(selectedSlot.slotId)?.warnings.length ?? 0) > 0 ? (
                    <div className="mt-4 space-y-3">
                      {slotInsights
                        .get(selectedSlot.slotId)
                        ?.warnings.map((warning) => (
                          <div
                            className="rounded-[1.25rem] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"
                            key={warning}
                          >
                            {warning}
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="mt-4 rounded-[1.25rem] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-950">
                      This slot resolves cleanly with its current saved chain.
                    </div>
                  )}
                </div>
              ) : null}
            </>
          ) : (
            <EmptyState
              title="No departments match that search"
              description="Clear the search or choose a different department name."
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
                    {selectedSlot.departmentName} / {selectedSlot.gradeLevel}
                  </h2>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-600">
                    Head approver: {selectedSlot.headUserName}. This slot no
                    longer falls back to the old matrix. Save a chain here to
                    make the route live.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <span
                    className={cn(
                      "rounded-full px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.16em]",
                      slotInsights.get(selectedSlot.slotId)?.configured
                        ? "bg-emerald-100 text-emerald-950"
                        : "bg-amber-100 text-amber-950",
                    )}
                  >
                    {slotInsights.get(selectedSlot.slotId)?.configured
                      ? "Configured"
                      : "Needs setup"}
                  </span>
                  <Button
                    disabled={isPending}
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setToast(null);
                      setEditorState(buildStarterEditorState(selectedSlot));
                    }}
                  >
                    Use starter chain
                  </Button>
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
                          active: true,
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

              <div className="mt-6 space-y-2">
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
            </div>

            <div className="rounded-[1.75rem] border border-stone-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-stone-500">
                    Ordered approvers
                  </p>
                  <h3 className="mt-2 text-2xl font-semibold text-slate-950">
                    Step editor
                  </h3>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    disabled={
                      isPending ||
                      editorState.steps.length >= maxSteps ||
                      hasEntityHeadStep(editorState.steps)
                    }
                    size="sm"
                    type="button"
                    variant="outline"
                    onClick={() =>
                      appendStep(
                        {
                          sourceType: "entity_head",
                          labelOverride: "Department Head",
                        },
                        setEditorState,
                      )
                    }
                  >
                    Add Department Head
                  </Button>
                  <Button
                    disabled={
                      isPending ||
                      editorState.steps.length >= maxSteps ||
                      hasFixedPrincipalStep(editorState.steps, selectedSlot.gradeLevel)
                    }
                    size="sm"
                    type="button"
                    variant="outline"
                    onClick={() =>
                      appendStep(
                        {
                          sourceType: "title_lookup",
                          titleKey: getPrincipalTitle(selectedSlot.gradeLevel),
                          labelOverride: getPrincipalTitle(selectedSlot.gradeLevel),
                        },
                        setEditorState,
                      )
                    }
                  >
                    Add {getPrincipalTitle(selectedSlot.gradeLevel)}
                  </Button>
                  <Button
                    disabled={isPending || editorState.steps.length >= maxSteps}
                    size="sm"
                    type="button"
                    variant="outline"
                    onClick={() =>
                      appendStep(
                        {
                          sourceType: "specific_user",
                        },
                        setEditorState,
                      )
                    }
                  >
                    <UserRound className="mr-2 h-3.5 w-3.5" />
                    Add Specific User
                  </Button>
                  <Button
                    disabled={isPending || editorState.steps.length >= maxSteps}
                    size="sm"
                    type="button"
                    variant="outline"
                    onClick={() =>
                      appendStep(
                        {
                          sourceType: "title_lookup",
                        },
                        setEditorState,
                      )
                    }
                  >
                    Add Custom Title
                  </Button>
                </div>
              </div>

              <div className="mt-5 space-y-4">
                {editorState.steps.map((step, index) => {
                  const stepPreview = editorPreview.steps[index];
                  const isCompactStep =
                    isEntityHeadStep(step) ||
                    isFixedPrincipalTitleStep(step.titleKey);

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
                          <h4 className="mt-2 text-2xl font-semibold text-slate-950">
                            {stepPreview?.label ?? `Step ${index + 1}`}
                          </h4>
                          <p className="mt-2 text-sm leading-6 text-stone-600">
                            {stepPreview?.resolution ?? "Configure this approver step."}
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

                      {isCompactStep ? (
                        <div className="mt-5 flex flex-wrap gap-2">
                          <span className="rounded-full bg-slate-950 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white">
                            Fixed step
                          </span>
                          {stepPreview?.warning ? (
                            <span className="rounded-full bg-amber-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-950">
                              Needs review
                            </span>
                          ) : null}
                        </div>
                      ) : (
                        <div className="mt-5 space-y-4">
                          {step.sourceType === "specific_user" ? (
                            <>
                              <div className="space-y-2">
                                <Label htmlFor={`specific-user-label-${index}`}>
                                  Step label
                                </Label>
                                <Input
                                  id={`specific-user-label-${index}`}
                                  placeholder="Optional custom label"
                                  value={step.labelOverride ?? ""}
                                  onChange={(event) =>
                                    updateStep(
                                      index,
                                      {
                                        labelOverride: normalizeOptionalValue(
                                          event.target.value,
                                        ),
                                      },
                                      setEditorState,
                                    )
                                  }
                                />
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor={`specific-user-${index}`}>
                                  Approver
                                </Label>
                                <select
                                  className="h-12 w-full rounded-2xl border border-stone-300 px-4 text-sm text-slate-950 shadow-sm"
                                  id={`specific-user-${index}`}
                                  value={step.userId ?? ""}
                                  onChange={(event) =>
                                    updateStep(
                                      index,
                                      {
                                        userId: normalizeOptionalValue(
                                          event.target.value,
                                        ),
                                      },
                                      setEditorState,
                                    )
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
                            </>
                          ) : (
                            <>
                              <div className="space-y-2">
                                <Label htmlFor={`title-lookup-label-${index}`}>
                                  Step label
                                </Label>
                                <Input
                                  id={`title-lookup-label-${index}`}
                                  placeholder="Optional custom label"
                                  value={step.labelOverride ?? ""}
                                  onChange={(event) =>
                                    updateStep(
                                      index,
                                      {
                                        labelOverride: normalizeOptionalValue(
                                          event.target.value,
                                        ),
                                      },
                                      setEditorState,
                                    )
                                  }
                                />
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor={`title-lookup-${index}`}>
                                  Lookup title
                                </Label>
                                <select
                                  className="h-12 w-full rounded-2xl border border-stone-300 px-4 text-sm text-slate-950 shadow-sm"
                                  id={`title-lookup-${index}`}
                                  value={step.titleKey ?? ""}
                                  onChange={(event) =>
                                    updateStep(
                                      index,
                                      {
                                        titleKey: normalizeOptionalValue(
                                          event.target.value,
                                        ),
                                      },
                                      setEditorState,
                                    )
                                  }
                                >
                                  <option value="">Select a title</option>
                                  {customTitleOptions.map((option) => (
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
                            </>
                          )}
                        </div>
                      )}
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
                    This chain resolves cleanly and is ready to save live.
                  </div>
                )}
              </article>
            </div>
          </section>
        ) : (
          <EmptyState
            title="Choose a department"
            description="Select a department from the left to configure its grade-level chain."
          />
        )}
      </section>
    </div>
  );
}

function buildDepartmentGroups(
  slots: DepartmentChainSlot[],
  slotInsights: Map<string, SlotInsight>,
) {
  const groupedDepartments = new Map<string, DepartmentGroup>();

  for (const slot of slots) {
    const existingDepartment = groupedDepartments.get(slot.entityId);
    const insight = slotInsights.get(slot.slotId);

    if (!existingDepartment) {
      groupedDepartments.set(slot.entityId, {
        entityId: slot.entityId,
        departmentName: slot.departmentName,
        slots: [slot],
        configuredCount: insight?.configured ? 1 : 0,
        warningCount: insight?.warnings.length ?? 0,
      });
      continue;
    }

    existingDepartment.slots.push(slot);
    existingDepartment.configuredCount += insight?.configured ? 1 : 0;
    existingDepartment.warningCount += insight?.warnings.length ?? 0;
  }

  return Array.from(groupedDepartments.values())
    .map((department) => ({
      ...department,
      slots: department.slots.sort((left, right) =>
        compareGradeLevels(left.gradeLevel, right.gradeLevel),
      ),
    }))
    .sort((left, right) =>
      left.departmentName.localeCompare(right.departmentName),
    );
}

function buildEditorState(slot: DepartmentChainSlot): EditorState {
  if (!slot.template?.steps.length || !slot.template.active) {
    return buildStarterEditorState(slot);
  }

  return {
    templateId: slot.template.id,
    name: slot.template.name,
    steps: slot.template.steps.map((step) => ({
      id: step.id,
      sourceType: step.sourceType,
      userId: step.userId ?? undefined,
      titleKey: step.titleKey ?? undefined,
      labelOverride: step.labelOverride ?? undefined,
    })),
  };
}

function buildStarterEditorState(slot: DepartmentChainSlot): EditorState {
  return {
    templateId: slot.template?.id,
    name: buildDefaultDepartmentChainName(slot.departmentName, slot.gradeLevel),
    steps: buildStarterSteps(slot.gradeLevel),
  };
}

function buildStarterSteps(
  gradeLevel: DepartmentChainGradeLevel,
): DepartmentApprovalChainEditorStep[] {
  return [
    {
      sourceType: "entity_head",
      labelOverride: "Department Head",
    },
    {
      sourceType: "title_lookup",
      titleKey: getPrincipalTitle(gradeLevel),
      labelOverride: getPrincipalTitle(gradeLevel),
    },
  ];
}

function buildSlotInsight(
  slot: DepartmentChainSlot,
  approverUsers: ApproverOption[],
  titleOptions: TitleOption[],
): SlotInsight {
  const configured = Boolean(slot.template?.active && slot.template.steps.length > 0);
  const preview = buildEditorPreview(
    slot,
    configured
      ? slot.template!.steps.map((step) => ({
          sourceType: step.sourceType,
          userId: step.userId ?? undefined,
          titleKey: step.titleKey ?? undefined,
          labelOverride: step.labelOverride ?? undefined,
        }))
      : buildStarterSteps(slot.gradeLevel),
    approverUsers,
    titleOptions,
  );
  const warnings = [...preview.warnings];

  if (!configured) {
    warnings.unshift(
      "No saved chain exists for this slot yet. Department submissions will be blocked until you save one.",
    );
  }

  return {
    configured,
    summary: preview.summary,
    warnings,
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
  if (isEntityHeadStep(step)) {
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
      warning: user
        ? null
        : "A specific-user step must target an active admin or approver.",
    };
  }

  const selectedTitle = titleOptions.find((option) => option.value === step.titleKey);
  const fallbackLabel = step.labelOverride?.trim() || step.titleKey?.trim() || "Title lookup";

  return {
    label: fallbackLabel,
    resolution: selectedTitle
      ? selectedTitle.count === 1 && selectedTitle.resolvedUserName
        ? `Resolves to ${selectedTitle.resolvedUserName} via the "${selectedTitle.value}" title.`
        : `Currently resolves to ${selectedTitle.count} matching users with the "${selectedTitle.value}" title.`
      : "Select a title that resolves to exactly one active admin or approver.",
    warning:
      !step.titleKey
        ? "A custom title step needs a title."
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

function hasEntityHeadStep(steps: DepartmentApprovalChainEditorStep[]) {
  return steps.some((step) => isEntityHeadStep(step));
}

function hasFixedPrincipalStep(
  steps: DepartmentApprovalChainEditorStep[],
  gradeLevel: DepartmentChainGradeLevel,
) {
  return steps.some(
    (step) =>
      step.sourceType === "title_lookup" &&
      step.titleKey === getPrincipalTitle(gradeLevel),
  );
}

function isEntityHeadStep(step: DepartmentApprovalChainEditorStep) {
  return step.sourceType === "entity_head";
}

function isFixedPrincipalTitleStep(titleKey?: string) {
  return fixedPrincipalTitles.has(titleKey ?? "");
}

function getPrincipalTitle(gradeLevel: DepartmentChainGradeLevel) {
  return gradeLevel === "MS" ? "MS Principal" : "HS Principal";
}

function appendStep(
  step: DepartmentApprovalChainEditorStep,
  setEditorState: Dispatch<SetStateAction<EditorState | null>>,
) {
  setEditorState((current) =>
    current
      ? {
          ...current,
          steps: [...current.steps, step],
        }
      : current,
  );
}

function updateStep(
  index: number,
  patch: Partial<DepartmentApprovalChainEditorStep>,
  setEditorState: Dispatch<SetStateAction<EditorState | null>>,
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

function compareGradeLevels(
  left: DepartmentChainGradeLevel,
  right: DepartmentChainGradeLevel,
) {
  const order: Record<DepartmentChainGradeLevel, number> = {
    HS: 0,
    MS: 1,
  };

  return order[left] - order[right];
}

function normalizeOptionalValue(value: string) {
  const normalizedValue = value.trim();
  return normalizedValue ? normalizedValue : undefined;
}
