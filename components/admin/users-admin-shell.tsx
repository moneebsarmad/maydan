"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  deactivateUserAction,
  inviteUserAction,
  updateUserAction,
} from "@/app/(dashboard)/admin/actions";
import { AdminNav } from "@/components/admin/admin-nav";
import { ShellDialog } from "@/components/shared/shell-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface UserListItem {
  id: string;
  name: string;
  email: string;
  role: string;
  entityId: string | null;
  entityName: string;
  active: boolean;
}

interface EntityOption {
  id: string;
  name: string;
}

interface UsersAdminShellProps {
  users: UserListItem[];
  entities: EntityOption[];
}

export function UsersAdminShell({ users, entities }: UsersAdminShellProps) {
  const router = useRouter();
  const [addOpen, setAddOpen] = useState(false);
  const [editUserId, setEditUserId] = useState<string | null>(null);
  const [deactivateUserId, setDeactivateUserId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const editUser = users.find((user) => user.id === editUserId);
  const deactivateUser = users.find((user) => user.id === deactivateUserId);

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-stone-500">
            Admin
          </p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight text-slate-950">
            User management
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-stone-600">
            Invite staff, update role assignments, and deactivate access using
            the live Supabase-backed admin controls.
          </p>
        </div>

        <Button type="button" onClick={() => setAddOpen(true)}>
          Add User
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

      <section className="space-y-4 md:hidden">
        {users.map((user) => (
          <article
            className="rounded-[1.75rem] border border-stone-200 bg-white p-5 shadow-sm"
            key={user.id}
          >
            <p className="text-xs uppercase tracking-[0.22em] text-stone-500">
              {user.role}
            </p>
            <h2 className="mt-2 text-xl font-semibold text-slate-950">
              {user.name}
            </h2>
            <p className="mt-1 text-sm text-stone-600">{user.email}</p>
            <p className="mt-3 text-sm text-stone-600">
              {user.entityName} · {user.active ? "Active" : "Inactive"}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                size="sm"
                type="button"
                variant="outline"
                onClick={() => setEditUserId(user.id)}
              >
                Edit User
              </Button>
              <Button
                size="sm"
                type="button"
                variant="ghost"
                onClick={() => setDeactivateUserId(user.id)}
              >
                Deactivate
              </Button>
            </div>
          </article>
        ))}
      </section>

      <section className="hidden overflow-hidden rounded-[2rem] border border-stone-200 bg-white shadow-sm md:block">
        <div className="grid grid-cols-[1.2fr_1.3fr_0.8fr_1fr_0.8fr_0.9fr] gap-3 border-b border-stone-200 bg-stone-50 px-6 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
          <span>Name</span>
          <span>Email</span>
          <span>Role</span>
          <span>Entity</span>
          <span>Status</span>
          <span>Actions</span>
        </div>
        {users.map((user) => (
          <div
            className="grid grid-cols-[1.2fr_1.3fr_0.8fr_1fr_0.8fr_0.9fr] gap-3 border-b border-stone-100 px-6 py-4 text-sm text-stone-700 last:border-0"
            key={user.id}
          >
            <span className="font-semibold text-slate-950">{user.name}</span>
            <span>{user.email}</span>
            <span>{user.role}</span>
            <span>{user.entityName}</span>
            <span>{user.active ? "Active" : "Inactive"}</span>
            <span className="flex flex-wrap gap-2">
              <Button
                size="sm"
                type="button"
                variant="outline"
                onClick={() => setEditUserId(user.id)}
              >
                Edit
              </Button>
              <Button
                size="sm"
                type="button"
                variant="ghost"
                onClick={() => setDeactivateUserId(user.id)}
              >
                Deactivate
              </Button>
            </span>
          </div>
        ))}
      </section>

      <ShellDialog
        open={addOpen}
        title="Add user"
        description="Invite a staff member and assign their initial role and entity."
        onClose={() => setAddOpen(false)}
      >
        <form
          className="space-y-4"
          onSubmit={async (event) => {
            event.preventDefault();
            setError(null);
            setFeedback(null);

            try {
              await inviteUserAction(new FormData(event.currentTarget));
              setAddOpen(false);
              setFeedback("Invite sent and user profile created.");
              router.refresh();
            } catch (actionError) {
              setError(
                actionError instanceof Error
                  ? actionError.message
                  : "Failed to invite user.",
              );
            }
          }}
        >
          <Field label="Full name" name="name" placeholder="Enter full name" />
          <Field
            label="Email"
            name="email"
            placeholder="name@bhaprep.org"
            type="email"
          />
          <div className="space-y-2">
            <Label htmlFor="new-role">Role</Label>
            <select
              className="h-12 w-full rounded-2xl border border-stone-300 px-4 text-sm"
              id="new-role"
              name="role"
            >
              <option value="submitter">submitter</option>
              <option value="approver">approver</option>
              <option value="viewer">viewer</option>
              <option value="admin">admin</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-entity">Entity</Label>
            <select
              className="h-12 w-full rounded-2xl border border-stone-300 px-4 text-sm"
              id="new-entity"
              name="entityId"
            >
              <option value="">Unassigned</option>
              {entities.map((entity) => (
                <option key={entity.id} value={entity.id}>
                  {entity.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Save user
            </Button>
          </div>
        </form>
      </ShellDialog>

      <ShellDialog
        open={Boolean(editUser)}
        title="Edit user"
        description="Update the role or entity assignment for this staff member."
        onClose={() => setEditUserId(null)}
      >
        {editUser ? (
          <form
            className="space-y-4"
            onSubmit={async (event) => {
              event.preventDefault();
              setError(null);
              setFeedback(null);

              try {
                await updateUserAction(new FormData(event.currentTarget));
                setEditUserId(null);
                setFeedback("User profile updated.");
                router.refresh();
              } catch (actionError) {
                setError(
                  actionError instanceof Error
                    ? actionError.message
                    : "Failed to update user.",
                );
              }
            }}
          >
            <input name="userId" type="hidden" value={editUser.id} />
            <Field label="Full name" name="name" defaultValue={editUser.name} />
            <Field
              label="Email"
              defaultValue={editUser.email}
              disabled
              name="email_display"
              type="email"
            />
            <div className="space-y-2">
              <Label htmlFor="edit-role">Role</Label>
              <select
                className="h-12 w-full rounded-2xl border border-stone-300 px-4 text-sm"
                defaultValue={editUser.role}
                id="edit-role"
                name="role"
              >
                <option value="submitter">submitter</option>
                <option value="approver">approver</option>
                <option value="viewer">viewer</option>
                <option value="admin">admin</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-entity">Entity</Label>
              <select
                className="h-12 w-full rounded-2xl border border-stone-300 px-4 text-sm"
                defaultValue={
                  editUser.entityId ?? ""
                }
                id="edit-entity"
                name="entityId"
              >
                <option value="">Unassigned</option>
                {entities.map((entity) => (
                  <option key={entity.id} value={entity.id}>
                    {entity.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setEditUserId(null)}>
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
        open={Boolean(deactivateUser)}
        title="Deactivate user"
        description={`This confirmation shell previews the destructive action for ${deactivateUser?.name ?? "the selected user"}.`}
        onClose={() => setDeactivateUserId(null)}
      >
        <form
          className="flex justify-end gap-3"
          onSubmit={async (event) => {
            event.preventDefault();
            setError(null);
            setFeedback(null);

            try {
              await deactivateUserAction(new FormData(event.currentTarget));
              setDeactivateUserId(null);
              setFeedback("User deactivated.");
              router.refresh();
            } catch (actionError) {
              setError(
                actionError instanceof Error
                  ? actionError.message
                  : "Failed to deactivate user.",
              );
            }
          }}
        >
          <input name="userId" type="hidden" value={deactivateUser?.id ?? ""} />
          <Button
            type="button"
            variant="outline"
            onClick={() => setDeactivateUserId(null)}
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
  disabled = false,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input
        defaultValue={defaultValue}
        disabled={disabled}
        name={name}
        placeholder={placeholder}
        type={type}
      />
    </div>
  );
}
