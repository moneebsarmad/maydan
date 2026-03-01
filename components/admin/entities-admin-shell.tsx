"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  createEntityAction,
  updateEntityAction,
} from "@/app/(dashboard)/admin/actions";
import { AdminNav } from "@/components/admin/admin-nav";
import { ShellDialog } from "@/components/shared/shell-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const entity = entities.find((item) => item.id === selectedEntity);
  const groupedEntities = entityTypeOrder
    .map((type) => ({
      type,
      items: entities.filter((item) => item.type === type),
    }))
    .filter((group) => group.items.length > 0);

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

      {feedback ? (
        <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
          {feedback}
        </p>
      ) : null}
      {error ? (
        <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800">
          {error}
        </p>
      ) : null}

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

      <ShellDialog
        open={addOpen}
        title="Add entity"
        description="Create a new club, house, department, or athletics group."
        onClose={() => setAddOpen(false)}
      >
        <form
          className="space-y-4"
          onSubmit={async (event) => {
            event.preventDefault();
            setError(null);
            setFeedback(null);

            try {
              await createEntityAction(new FormData(event.currentTarget));
              setAddOpen(false);
              setFeedback("Entity created.");
              router.refresh();
            } catch (actionError) {
              setError(
                actionError instanceof Error
                  ? actionError.message
                  : "Failed to create entity.",
              );
            }
          }}
        >
          <Field label="Entity name" name="name" placeholder="Enter entity name" />
          <div className="space-y-2">
            <Label htmlFor="entity-type">Entity type</Label>
            <select
              className="h-12 w-full rounded-2xl border border-stone-300 px-4 text-sm"
              id="entity-type"
              name="type"
            >
              <option value="club">club</option>
              <option value="house">house</option>
              <option value="department">department</option>
              <option value="athletics">athletics</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="entity-grade-level">Grade level</Label>
            <select
              className="h-12 w-full rounded-2xl border border-stone-300 px-4 text-sm"
              id="entity-grade-level"
              name="gradeLevel"
            >
              <option value="">Unspecified</option>
              <option value="MS">MS</option>
              <option value="HS">HS</option>
              <option value="Both">Both</option>
            </select>
          </div>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Save entity
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
            onSubmit={async (event) => {
              event.preventDefault();
              setError(null);
              setFeedback(null);

              try {
                await updateEntityAction(new FormData(event.currentTarget));
                setSelectedEntity(null);
                setFeedback("Entity updated.");
                router.refresh();
              } catch (actionError) {
                setError(
                  actionError instanceof Error
                    ? actionError.message
                    : "Failed to update entity.",
                );
              }
            }}
          >
            <input name="entityId" type="hidden" value={entity.id} />
            <Field label="Entity name" name="name" defaultValue={entity.name} />
            <div className="space-y-2">
              <Label htmlFor="edit-entity-type">Entity type</Label>
              <select
                className="h-12 w-full rounded-2xl border border-stone-300 px-4 text-sm"
                defaultValue={entity.type}
                id="edit-entity-type"
                name="type"
              >
                <option value="club">club</option>
                <option value="house">house</option>
                <option value="department">department</option>
                <option value="athletics">athletics</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-grade-level">Grade level</Label>
              <select
                className="h-12 w-full rounded-2xl border border-stone-300 px-4 text-sm"
                defaultValue={entity.gradeLevel ?? ""}
                id="edit-grade-level"
                name="gradeLevel"
              >
                <option value="">Unspecified</option>
                <option value="MS">MS</option>
                <option value="HS">HS</option>
                <option value="Both">Both</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="head-user">Head user</Label>
              <select
                className="h-12 w-full rounded-2xl border border-stone-300 px-4 text-sm"
                defaultValue={entity.headUserId ?? ""}
                id="head-user"
                name="headUserId"
              >
                <option value="">Unassigned</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setSelectedEntity(null)}
              >
                Cancel
              </Button>
              <Button type="submit">
                Save changes
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
  name,
  defaultValue,
  placeholder,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  placeholder?: string;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input defaultValue={defaultValue} name={name} placeholder={placeholder} />
    </div>
  );
}
