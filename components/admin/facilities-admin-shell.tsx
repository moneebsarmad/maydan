"use client";

import { useEffect, useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm, type UseFormRegisterReturn } from "react-hook-form";
import {
  createFacilityAction,
  deactivateFacilityAction,
  updateFacilityAction,
} from "@/app/(dashboard)/admin/actions";
import { AdminNav } from "@/components/admin/admin-nav";
import { EmptyState } from "@/components/shared/empty-state";
import { FormError } from "@/components/shared/form-error";
import { ConfirmModal } from "@/components/shared/confirm-modal";
import { LoadingLabel } from "@/components/shared/loading-label";
import { ShellDialog } from "@/components/shared/shell-dialog";
import { AppToast } from "@/components/shared/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createFacilityFormSchema,
  updateFacilityFormSchema,
  type CreateFacilityFormValues,
  type UpdateFacilityFormValues,
} from "@/lib/utils/admin-forms";

interface FacilityListItem {
  id: string;
  name: string;
  capacity: number | null;
  notes: string | null;
  active: boolean;
}

interface FacilitiesAdminShellProps {
  facilities: FacilityListItem[];
}

export function FacilitiesAdminShell({
  facilities,
}: FacilitiesAdminShellProps) {
  const router = useRouter();
  const [addOpen, setAddOpen] = useState(false);
  const [editFacilityId, setEditFacilityId] = useState<string | null>(null);
  const [deactivateFacilityId, setDeactivateFacilityId] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    title: string;
    description: string;
    variant: "success" | "error";
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  const facility = facilities.find((item) => item.id === editFacilityId);
  const facilityToDeactivate = facilities.find(
    (item) => item.id === deactivateFacilityId,
  );
  const addForm = useForm<CreateFacilityFormValues>({
    resolver: zodResolver(createFacilityFormSchema),
    defaultValues: {
      name: "",
      capacity: undefined,
      notes: undefined,
    },
  });
  const editForm = useForm<UpdateFacilityFormValues>({
    resolver: zodResolver(updateFacilityFormSchema),
    defaultValues: {
      facilityId: "",
      name: "",
      capacity: undefined,
      notes: undefined,
    },
  });

  useEffect(() => {
    if (!facility) {
      return;
    }

    editForm.reset({
      facilityId: facility.id,
      name: facility.name,
      capacity: facility.capacity ?? undefined,
      notes: facility.notes ?? undefined,
    });
  }, [editForm, facility]);

  useEffect(() => {
    if (!addOpen) {
      addForm.reset({
        name: "",
        capacity: undefined,
        notes: undefined,
      });
    }
  }, [addForm, addOpen]);

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-stone-500">
            Admin
          </p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight text-slate-950">
            Facility management
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-stone-600">
            Facility records are now managed through live Supabase-backed add,
            edit, and deactivate actions.
          </p>
        </div>
        <Button type="button" onClick={() => setAddOpen(true)}>
          Add Facility
        </Button>
      </section>

      <AdminNav />

      {toast ? (
        <AppToast
          title={toast.title}
          description={toast.description}
          variant={toast.variant}
        />
      ) : null}

      {facilities.length ? (
        <section className="grid gap-4 lg:grid-cols-3">
          {facilities.map((item) => (
            <article
              className="rounded-[1.75rem] border border-stone-200 bg-white p-5 shadow-sm"
              key={item.id}
            >
              <p className="text-xs uppercase tracking-[0.24em] text-stone-500">
                Capacity
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                {item.name}
              </h2>
              <p className="mt-2 text-sm text-stone-600">
                {item.capacity ?? "Unset"} people · {item.active ? "Active" : "Inactive"}
              </p>
              <p className="mt-2 text-sm text-stone-600">
                {item.notes || "No notes provided."}
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Button
                  size="sm"
                  type="button"
                  variant="outline"
                  onClick={() => setEditFacilityId(item.id)}
                >
                  Edit
                </Button>
                <Button
                  size="sm"
                  type="button"
                  variant="ghost"
                  onClick={() => setDeactivateFacilityId(item.id)}
                >
                  Deactivate
                </Button>
              </div>
            </article>
          ))}
        </section>
      ) : (
        <EmptyState
          title="No facilities configured yet"
          description="Add facilities here so submitters can choose live spaces for event requests."
        />
      )}

      <ShellDialog
        open={addOpen}
        title="Add facility"
        description="Create a new facility option for event submissions."
        onClose={() => setAddOpen(false)}
      >
        <form
          className="space-y-4"
          onSubmit={addForm.handleSubmit((values) => {
            setToast(null);

            startTransition(async () => {
              try {
                await createFacilityAction(buildFacilityFormData(values));
                setAddOpen(false);
                setToast({
                  title: "Facility created",
                  description: "Facility created successfully.",
                  variant: "success",
                });
                router.refresh();
              } catch (actionError) {
                setToast({
                  title: "Create failed",
                  description:
                    actionError instanceof Error
                      ? actionError.message
                      : "Failed to create facility.",
                  variant: "error",
                });
              }
            });
          })}
        >
          <Field
            label="Facility name"
            placeholder="Enter facility name"
            registration={addForm.register("name")}
          />
          <FormError message={addForm.formState.errors.name?.message} />

          <Field
            label="Capacity"
            placeholder="0"
            registration={addForm.register("capacity")}
            type="number"
          />
          <FormError
            message={
              addForm.formState.errors.capacity?.message
                ? String(addForm.formState.errors.capacity?.message)
                : undefined
            }
          />

          <Field
            label="Notes"
            placeholder="Optional facility notes"
            registration={addForm.register("notes")}
          />
          <FormError message={addForm.formState.errors.notes?.message} />

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button disabled={isPending} type="submit">
              {isPending ? <LoadingLabel label="Saving..." /> : "Save facility"}
            </Button>
          </div>
        </form>
      </ShellDialog>

      <ShellDialog
        open={Boolean(facility)}
        title="Edit facility"
        description="Update the facility name or capacity values."
        onClose={() => setEditFacilityId(null)}
      >
        {facility ? (
          <form
            className="space-y-4"
            onSubmit={editForm.handleSubmit((values) => {
              setToast(null);

              startTransition(async () => {
                try {
                  await updateFacilityAction(buildFacilityFormData(values));
                  setEditFacilityId(null);
                  setToast({
                    title: "Facility updated",
                    description: "Facility updated successfully.",
                    variant: "success",
                  });
                  router.refresh();
                } catch (actionError) {
                  setToast({
                    title: "Update failed",
                    description:
                      actionError instanceof Error
                        ? actionError.message
                        : "Failed to update facility.",
                    variant: "error",
                  });
                }
              });
            })}
          >
            <input type="hidden" {...editForm.register("facilityId")} />

            <Field
              label="Facility name"
              registration={editForm.register("name")}
            />
            <FormError message={editForm.formState.errors.name?.message} />

            <Field
              label="Capacity"
              registration={editForm.register("capacity")}
              type="number"
            />
            <FormError
              message={
                editForm.formState.errors.capacity?.message
                  ? String(editForm.formState.errors.capacity?.message)
                  : undefined
              }
            />

            <Field
              label="Notes"
              registration={editForm.register("notes")}
            />
            <FormError message={editForm.formState.errors.notes?.message} />

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditFacilityId(null)}
              >
                Cancel
              </Button>
              <Button disabled={isPending} type="submit">
                {isPending ? <LoadingLabel label="Saving..." /> : "Save changes"}
              </Button>
            </div>
          </form>
        ) : null}
      </ShellDialog>

      <ConfirmModal
        open={Boolean(deactivateFacilityId)}
        title="Deactivate facility"
        description={`Confirm the removal of ${facilityToDeactivate?.name ?? "this facility"} from the event form catalogue.`}
        confirmLabel={isPending ? "Deactivating..." : "Confirm deactivate"}
        onCancel={() => setDeactivateFacilityId(null)}
        onConfirm={() => {
          if (!deactivateFacilityId) {
            return;
          }

          setToast(null);
          startTransition(async () => {
            try {
              const formData = new FormData();
              formData.set("facilityId", deactivateFacilityId);
              await deactivateFacilityAction(formData);
              setDeactivateFacilityId(null);
              setToast({
                title: "Facility deactivated",
                description: "The facility has been removed from active submission options.",
                variant: "success",
              });
              router.refresh();
            } catch (actionError) {
              setToast({
                title: "Deactivation failed",
                description:
                  actionError instanceof Error
                    ? actionError.message
                    : "Failed to deactivate facility.",
                variant: "error",
              });
            }
          });
        }}
      />
    </div>
  );
}

function Field({
  label,
  placeholder,
  registration,
  type = "text",
}: {
  label: string;
  placeholder?: string;
  registration: UseFormRegisterReturn;
  type?: string;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input placeholder={placeholder} type={type} {...registration} />
    </div>
  );
}

function buildFacilityFormData(
  values: Record<string, string | number | undefined>,
) {
  const formData = new FormData();

  for (const [key, value] of Object.entries(values)) {
    formData.set(key, value === undefined ? "" : String(value));
  }

  return formData;
}
