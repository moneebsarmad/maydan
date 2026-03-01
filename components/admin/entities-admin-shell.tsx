"use client";

import { useEffect, useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm, type UseFormRegisterReturn } from "react-hook-form";
import {
  createEntityAction,
  updateEntityAction,
} from "@/app/(dashboard)/admin/actions";
import { AdminNav } from "@/components/admin/admin-nav";
import { EmptyState } from "@/components/shared/empty-state";
import { FormError } from "@/components/shared/form-error";
import { LoadingLabel } from "@/components/shared/loading-label";
import { ShellDialog } from "@/components/shared/shell-dialog";
import { AppToast } from "@/components/shared/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createEntityFormSchema,
  entityTypeOptions,
  gradeLevelOptions,
  updateEntityFormSchema,
  type CreateEntityFormValues,
  type UpdateEntityFormValues,
} from "@/lib/utils/admin-forms";

interface EntityListItem {
  id: string;
  name: string;
  type: string;
  gradeLevel: string | null;
  headUserId: string | null;
  headUserName: string;
}

interface UserOption {
  id: string;
  name: string;
}

interface EntitiesAdminShellProps {
  entities: EntityListItem[];
  users: UserOption[];
}

export function EntitiesAdminShell({
  entities,
  users,
}: EntitiesAdminShellProps) {
  const router = useRouter();
  const [addOpen, setAddOpen] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    title: string;
    description: string;
    variant: "success" | "error";
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  const entity = entities.find((item) => item.id === selectedEntity);
  const groupedEntities = entityTypeOrder
    .map((type) => ({
      type,
      items: entities.filter((item) => item.type === type),
    }))
    .filter((group) => group.items.length > 0);
  const addForm = useForm<CreateEntityFormValues>({
    resolver: zodResolver(createEntityFormSchema),
    defaultValues: {
      name: "",
      type: "club",
      gradeLevel: "",
    },
  });
  const editForm = useForm<UpdateEntityFormValues>({
    resolver: zodResolver(updateEntityFormSchema),
    defaultValues: {
      entityId: "",
      name: "",
      type: "club",
      gradeLevel: "",
      headUserId: undefined,
    },
  });

  useEffect(() => {
    if (!entity) {
      return;
    }

    editForm.reset({
      entityId: entity.id,
      name: entity.name,
      type: entity.type as UpdateEntityFormValues["type"],
      gradeLevel: (entity.gradeLevel ?? "") as UpdateEntityFormValues["gradeLevel"],
      headUserId: entity.headUserId ?? undefined,
    });
  }, [editForm, entity]);

  useEffect(() => {
    if (!addOpen) {
      addForm.reset({
        name: "",
        type: "club",
        gradeLevel: "",
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
            Entity management
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-stone-600">
            Clubs, houses, departments, and athletics groups are grouped here
            with live head-user assignment controls.
          </p>
        </div>
        <Button type="button" onClick={() => setAddOpen(true)}>
          Add Entity
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

      {groupedEntities.length ? (
        <section className="space-y-6">
          {groupedEntities.map((group) => (
            <div className="space-y-4" key={group.type}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-stone-500">
                    Entity type
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                    {formatEntityTypeLabel(group.type)}
                  </h2>
                </div>
                <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-stone-700">
                  {group.items.length} total
                </span>
              </div>
              <div className="grid gap-4 lg:grid-cols-3">
                {group.items.map((item) => (
                  <article
                    className="rounded-[1.75rem] border border-stone-200 bg-white p-5 shadow-sm"
                    key={item.id}
                  >
                    <p className="text-xs uppercase tracking-[0.24em] text-stone-500">
                      {item.type}
                    </p>
                    <h3 className="mt-2 text-2xl font-semibold text-slate-950">
                      {item.name}
                    </h3>
                    <p className="mt-3 text-sm leading-6 text-stone-600">
                      Head user assignment: {item.headUserName}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-stone-600">
                      Grade level: {item.gradeLevel ?? "Unspecified"}
                    </p>
                    <Button
                      className="mt-5"
                      size="sm"
                      type="button"
                      variant="outline"
                      onClick={() => setSelectedEntity(item.id)}
                    >
                      Edit entity
                    </Button>
                  </article>
                ))}
              </div>
            </div>
          ))}
        </section>
      ) : (
        <EmptyState
          title="No entities configured yet"
          description="Add the school entities here so routing and user assignments have live records to target."
        />
      )}

      <ShellDialog
        open={addOpen}
        title="Add entity"
        description="Create a new club, house, department, or athletics group."
        onClose={() => setAddOpen(false)}
      >
        <form
          className="space-y-4"
          onSubmit={addForm.handleSubmit((values) => {
            setToast(null);

            startTransition(async () => {
              try {
                await createEntityAction(buildEntityFormData(values));
                setAddOpen(false);
                setToast({
                  title: "Entity created",
                  description: "Entity created successfully.",
                  variant: "success",
                });
                router.refresh();
              } catch (actionError) {
                setToast({
                  title: "Create failed",
                  description:
                    actionError instanceof Error
                      ? actionError.message
                      : "Failed to create entity.",
                  variant: "error",
                });
              }
            });
          })}
        >
          <Field
            label="Entity name"
            placeholder="Enter entity name"
            registration={addForm.register("name")}
          />
          <FormError message={addForm.formState.errors.name?.message} />

          <div className="space-y-2">
            <Label htmlFor="entity-type">Entity type</Label>
            <select
              className="h-12 w-full rounded-2xl border border-stone-300 px-4 text-sm"
              id="entity-type"
              {...addForm.register("type")}
            >
              {entityTypeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <FormError message={addForm.formState.errors.type?.message} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="entity-grade-level">Grade level</Label>
            <select
              className="h-12 w-full rounded-2xl border border-stone-300 px-4 text-sm"
              id="entity-grade-level"
              {...addForm.register("gradeLevel")}
            >
              <option value="">Unspecified</option>
              {gradeLevelOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <FormError message={addForm.formState.errors.gradeLevel?.message} />
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button disabled={isPending} type="submit">
              {isPending ? <LoadingLabel label="Saving..." /> : "Save entity"}
            </Button>
          </div>
        </form>
      </ShellDialog>

      <ShellDialog
        open={Boolean(entity)}
        title="Edit entity"
        description="Update the head user assignment or type metadata for this entity."
        onClose={() => setSelectedEntity(null)}
      >
        {entity ? (
          <form
            className="space-y-4"
            onSubmit={editForm.handleSubmit((values) => {
              setToast(null);

              startTransition(async () => {
                try {
                  await updateEntityAction(buildEntityFormData(values));
                  setSelectedEntity(null);
                  setToast({
                    title: "Entity updated",
                    description: "Entity updated successfully.",
                    variant: "success",
                  });
                  router.refresh();
                } catch (actionError) {
                  setToast({
                    title: "Update failed",
                    description:
                      actionError instanceof Error
                        ? actionError.message
                        : "Failed to update entity.",
                    variant: "error",
                  });
                }
              });
            })}
          >
            <input type="hidden" {...editForm.register("entityId")} />

            <Field
              label="Entity name"
              registration={editForm.register("name")}
            />
            <FormError message={editForm.formState.errors.name?.message} />

            <div className="space-y-2">
              <Label htmlFor="edit-entity-type">Entity type</Label>
              <select
                className="h-12 w-full rounded-2xl border border-stone-300 px-4 text-sm"
                id="edit-entity-type"
                {...editForm.register("type")}
              >
                {entityTypeOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <FormError message={editForm.formState.errors.type?.message} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-grade-level">Grade level</Label>
              <select
                className="h-12 w-full rounded-2xl border border-stone-300 px-4 text-sm"
                id="edit-grade-level"
                {...editForm.register("gradeLevel")}
              >
                <option value="">Unspecified</option>
                {gradeLevelOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <FormError message={editForm.formState.errors.gradeLevel?.message} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="head-user">Head user</Label>
              <select
                className="h-12 w-full rounded-2xl border border-stone-300 px-4 text-sm"
                id="head-user"
                {...editForm.register("headUserId")}
              >
                <option value="">Unassigned</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
              <FormError message={editForm.formState.errors.headUserId?.message} />
            </div>

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setSelectedEntity(null)}
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
    </div>
  );
}

const entityTypeOrder = ["club", "house", "department", "athletics"] as const;

function formatEntityTypeLabel(entityType: string) {
  if (entityType === "athletics") {
    return "Athletics";
  }

  if (entityType === "department") {
    return "Departments";
  }

  return `${entityType.charAt(0).toUpperCase()}${entityType.slice(1)}s`;
}

function Field({
  label,
  placeholder,
  registration,
}: {
  label: string;
  placeholder?: string;
  registration: UseFormRegisterReturn;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input placeholder={placeholder} {...registration} />
    </div>
  );
}

function buildEntityFormData(values: Record<string, string | undefined>) {
  const formData = new FormData();

  for (const [key, value] of Object.entries(values)) {
    formData.set(key, value ?? "");
  }

  return formData;
}
