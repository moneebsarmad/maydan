"use client";

import { useEffect, useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm, type UseFormRegisterReturn } from "react-hook-form";
import {
  deactivateUserAction,
  inviteUserAction,
  updateUserAction,
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
  inviteUserFormSchema,
  updateUserFormSchema,
  type InviteUserFormValues,
  type UpdateUserFormValues,
} from "@/lib/utils/admin-forms";

interface UserListItem {
  id: string;
  name: string;
  email: string;
  role: string;
  title: string | null;
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
  const [toast, setToast] = useState<{
    title: string;
    description: string;
    variant: "success" | "error";
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  const editUser = users.find((user) => user.id === editUserId);
  const deactivateUser = users.find((user) => user.id === deactivateUserId);
  const addForm = useForm<InviteUserFormValues>({
    resolver: zodResolver(inviteUserFormSchema),
    defaultValues: {
      name: "",
      email: "",
      role: "staff",
      title: undefined,
      entityId: undefined,
    },
  });
  const editForm = useForm<UpdateUserFormValues>({
    resolver: zodResolver(updateUserFormSchema),
    defaultValues: {
      userId: "",
      name: "",
      role: "staff",
      title: undefined,
      entityId: undefined,
    },
  });
  const addRole = addForm.watch("role");
  const editRole = editForm.watch("role");

  useEffect(() => {
    if (!editUser) {
      return;
    }

    editForm.reset({
      userId: editUser.id,
      name: editUser.name,
      role: editUser.role as UpdateUserFormValues["role"],
      title: editUser.title ?? undefined,
      entityId: editUser.entityId ?? undefined,
    });
  }, [editForm, editUser]);

  useEffect(() => {
    if (!addOpen) {
      addForm.reset({
        name: "",
        email: "",
        role: "staff",
        title: undefined,
        entityId: undefined,
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

      {toast ? (
        <AppToast
          title={toast.title}
          description={toast.description}
          variant={toast.variant}
        />
      ) : null}

      {users.length ? (
        <>
          <section className="space-y-4 md:hidden">
            {users.map((user) => (
              <article
                className="rounded-[1.75rem] border border-stone-200 bg-white p-5 shadow-sm"
                key={user.id}
              >
                <p className="text-xs uppercase tracking-[0.22em] text-stone-500">
                  {user.title ?? user.role}
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
                <span>{user.title ?? user.role}</span>
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
        </>
      ) : (
        <EmptyState
          title="No staff users yet"
          description="Invite staff here to create their Maydan access and role assignments."
        />
      )}

      <ShellDialog
        open={addOpen}
        title="Add user"
        description="Invite a staff member and assign their initial role and entity."
        onClose={() => setAddOpen(false)}
      >
        <form
          className="space-y-4"
          onSubmit={addForm.handleSubmit((values) => {
            setToast(null);

            startTransition(async () => {
              try {
                await inviteUserAction(buildUserFormData(values));
                setAddOpen(false);
                setToast({
                  title: "Invite sent",
                  description: "Invite sent and user profile created.",
                  variant: "success",
                });
                router.refresh();
              } catch (actionError) {
                setToast({
                  title: "Invite failed",
                  description:
                    actionError instanceof Error
                      ? actionError.message
                      : "Failed to invite user.",
                  variant: "error",
                });
              }
            });
          })}
        >
          <Field
            label="Full name"
            placeholder="Enter full name"
            registration={addForm.register("name")}
          />
          <FormError message={addForm.formState.errors.name?.message} />

          <Field
            label="Email"
            placeholder="name@bhaprep.org"
            registration={addForm.register("email")}
            type="email"
          />
          <FormError message={addForm.formState.errors.email?.message} />

          <div className="space-y-2">
            <Label htmlFor="new-role">Role</Label>
            <select
              className="h-12 w-full rounded-2xl border border-stone-300 px-4 text-sm"
              id="new-role"
              {...addForm.register("role")}
            >
              <option value="staff">staff</option>
              <option value="approver">approver</option>
              <option value="viewer">viewer</option>
              <option value="admin">admin</option>
            </select>
            <FormError message={addForm.formState.errors.role?.message} />
          </div>

          <Field
            label="Title"
            placeholder={addRole === "admin" ? "Admin" : "Optional routing title"}
            registration={addForm.register("title")}
            disabled={addRole === "admin"}
          />
          <p className="text-xs leading-5 text-stone-500">
            Use routing titles like `HS Principal`, `MS Principal`,
            `Facilities Director`, or `Department Head` when applicable.
          </p>
          <FormError message={addForm.formState.errors.title?.message} />

          <div className="space-y-2">
            <Label htmlFor="new-entity">Entity</Label>
            <select
              className="h-12 w-full rounded-2xl border border-stone-300 px-4 text-sm"
              id="new-entity"
              {...addForm.register("entityId")}
            >
              <option value="">Unassigned</option>
              {entities.map((entity) => (
                <option key={entity.id} value={entity.id}>
                  {entity.name}
                </option>
              ))}
            </select>
            <FormError message={addForm.formState.errors.entityId?.message} />
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button disabled={isPending} type="submit">
              {isPending ? <LoadingLabel label="Saving..." /> : "Save user"}
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
            onSubmit={editForm.handleSubmit((values) => {
              setToast(null);

              startTransition(async () => {
                try {
                  await updateUserAction(buildUserFormData(values));
                  setEditUserId(null);
                  setToast({
                    title: "User updated",
                    description: "User profile updated.",
                    variant: "success",
                  });
                  router.refresh();
                } catch (actionError) {
                  setToast({
                    title: "Update failed",
                    description:
                      actionError instanceof Error
                        ? actionError.message
                        : "Failed to update user.",
                    variant: "error",
                  });
                }
              });
            })}
          >
            <input type="hidden" {...editForm.register("userId")} />

            <Field
              label="Full name"
              registration={editForm.register("name")}
            />
            <FormError message={editForm.formState.errors.name?.message} />

            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                value={editUser.email}
                disabled
                readOnly
                type="email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-role">Role</Label>
              <select
                className="h-12 w-full rounded-2xl border border-stone-300 px-4 text-sm"
                id="edit-role"
                {...editForm.register("role")}
              >
                <option value="staff">staff</option>
                <option value="approver">approver</option>
                <option value="viewer">viewer</option>
                <option value="admin">admin</option>
              </select>
              <FormError message={editForm.formState.errors.role?.message} />
            </div>

            <Field
              label="Title"
              placeholder={
                editRole === "admin" ? "Admin" : "Optional routing title"
              }
              registration={editForm.register("title")}
              disabled={editRole === "admin"}
            />
            <p className="text-xs leading-5 text-stone-500">
              Keep routing-critical titles accurate so approval chains continue
              resolving correctly.
            </p>
            <FormError message={editForm.formState.errors.title?.message} />

            <div className="space-y-2">
              <Label htmlFor="edit-entity">Entity</Label>
              <select
                className="h-12 w-full rounded-2xl border border-stone-300 px-4 text-sm"
                id="edit-entity"
                {...editForm.register("entityId")}
              >
                <option value="">Unassigned</option>
                {entities.map((entity) => (
                  <option key={entity.id} value={entity.id}>
                    {entity.name}
                  </option>
                ))}
              </select>
              <FormError message={editForm.formState.errors.entityId?.message} />
            </div>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setEditUserId(null)}>
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
        open={Boolean(deactivateUser)}
        title="Deactivate user"
        description={`Deactivate ${deactivateUser?.name ?? "this user"} and block future Maydan access.`}
        confirmLabel={isPending ? "Deactivating..." : "Confirm deactivate"}
        onCancel={() => setDeactivateUserId(null)}
        onConfirm={() => {
          if (!deactivateUserId) {
            return;
          }

          setToast(null);
          startTransition(async () => {
            try {
              const formData = new FormData();
              formData.set("userId", deactivateUserId);
              await deactivateUserAction(formData);
              setDeactivateUserId(null);
              setToast({
                title: "User deactivated",
                description: "The user can no longer access Maydan.",
                variant: "success",
              });
              router.refresh();
            } catch (actionError) {
              setToast({
                title: "Deactivation failed",
                description:
                  actionError instanceof Error
                    ? actionError.message
                    : "Failed to deactivate user.",
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
  disabled = false,
}: {
  label: string;
  placeholder?: string;
  registration: UseFormRegisterReturn;
  type?: string;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input
        disabled={disabled}
        placeholder={placeholder}
        type={type}
        {...registration}
      />
    </div>
  );
}

function buildUserFormData(values: Record<string, string | undefined>) {
  const formData = new FormData();

  for (const [key, value] of Object.entries(values)) {
    formData.set(key, value ?? "");
  }

  return formData;
}
