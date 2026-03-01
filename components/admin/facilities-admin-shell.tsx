"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  createFacilityAction,
  deactivateFacilityAction,
  updateFacilityAction,
} from "@/app/(dashboard)/admin/actions";
import { AdminNav } from "@/components/admin/admin-nav";
import { ShellDialog } from "@/components/shared/shell-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const facility = facilities.find((item) => item.id === editFacilityId);
  const facilityToDeactivate = facilities.find(
    (item) => item.id === deactivateFacilityId,
  );

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

      <ShellDialog
        open={addOpen}
        title="Add facility"
        description="Create a new facility option for event submissions."
        onClose={() => setAddOpen(false)}
      >
        <form
          className="space-y-4"
          onSubmit={async (event) => {
            event.preventDefault();
            setError(null);
            setFeedback(null);

            try {
              await createFacilityAction(new FormData(event.currentTarget));
              setAddOpen(false);
              setFeedback("Facility created.");
              router.refresh();
            } catch (actionError) {
              setError(
                actionError instanceof Error
                  ? actionError.message
                  : "Failed to create facility.",
              );
            }
          }}
        >
          <Field label="Facility name" name="name" placeholder="Enter facility name" />
          <Field label="Capacity" name="capacity" placeholder="0" type="number" />
          <Field
            label="Notes"
            name="notes"
            placeholder="Optional facility notes"
          />
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Save facility
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
            onSubmit={async (event) => {
              event.preventDefault();
              setError(null);
              setFeedback(null);

              try {
                await updateFacilityAction(new FormData(event.currentTarget));
                setEditFacilityId(null);
                setFeedback("Facility updated.");
                router.refresh();
              } catch (actionError) {
                setError(
                  actionError instanceof Error
                    ? actionError.message
                    : "Failed to update facility.",
                );
              }
            }}
          >
            <input name="facilityId" type="hidden" value={facility.id} />
            <Field label="Facility name" name="name" defaultValue={facility.name} />
            <Field
              label="Capacity"
              defaultValue={facility.capacity ? `${facility.capacity}` : ""}
              name="capacity"
              type="number"
            />
            <Field
              label="Notes"
              name="notes"
              defaultValue={facility.notes ?? ""}
            />
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditFacilityId(null)}
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

      <ShellDialog
        open={Boolean(deactivateFacilityId)}
        title="Deactivate facility"
        description={`Confirm the removal of ${facilityToDeactivate?.name ?? "this facility"} from the event form catalogue.`}
        onClose={() => setDeactivateFacilityId(null)}
      >
        <form
          className="flex justify-end gap-3"
          onSubmit={async (event) => {
            event.preventDefault();
            setError(null);
            setFeedback(null);

            try {
              await deactivateFacilityAction(new FormData(event.currentTarget));
              setDeactivateFacilityId(null);
              setFeedback("Facility deactivated.");
              router.refresh();
            } catch (actionError) {
              setError(
                actionError instanceof Error
                  ? actionError.message
                  : "Failed to deactivate facility.",
              );
            }
          }}
        >
          <input
            name="facilityId"
            type="hidden"
            value={deactivateFacilityId ?? ""}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => setDeactivateFacilityId(null)}
          >
            Keep active
          </Button>
          <Button type="submit">
            Confirm deactivate
          </Button>
        </form>
      </ShellDialog>
    </div>
  );
}

function Field({
  label,
  name,
  defaultValue,
  placeholder,
  type = "text",
}: {
  label: string;
  name: string;
  defaultValue?: string;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input
        defaultValue={defaultValue}
        name={name}
        placeholder={placeholder}
        type={type}
      />
    </div>
  );
}
