"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  createEntityFormSchema,
  createFacilityFormSchema,
  getZodErrorMessage,
  inviteUserFormSchema,
  updateEntityFormSchema,
  updateFacilityFormSchema,
  updateUserFormSchema,
} from "@/lib/utils/admin-forms";

const passwordRedirectUrl = `${
  process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
}/update-password`;

export async function inviteUserAction(formData: FormData) {
  await requireAdmin();
  const parsedInput = inviteUserFormSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    role: formData.get("role"),
    entityId: formData.get("entityId"),
  });

  if (!parsedInput.success) {
    throw new Error(getZodErrorMessage(parsedInput.error));
  }

  const adminClient = createAdminClient();
  const {
    name,
    role,
    entityId,
  } = parsedInput.data;
  const email = parsedInput.data.email.toLowerCase();

  let authUser = await findAuthUserByEmail(adminClient, email);

  if (!authUser) {
    const { data, error } = await adminClient.auth.admin.inviteUserByEmail(email, {
      data: {
        full_name: name,
        role,
      },
      redirectTo: passwordRedirectUrl,
    });

    if (error) {
      throw new Error(error.message);
    }

    authUser = data.user ?? null;
  }

  if (!authUser) {
    throw new Error("Unable to provision the auth account.");
  }

  const { error: profileError } = await adminClient.from("users").upsert(
    {
      id: authUser.id,
      name,
      email,
      role,
      title: role === "admin" ? "Admin" : null,
      entity_id: entityId,
      active: true,
    },
    { onConflict: "id" },
  );

  if (profileError) {
    throw new Error(profileError.message);
  }

  revalidatePath("/admin/users");
}

export async function updateUserAction(formData: FormData) {
  await requireAdmin();
  const parsedInput = updateUserFormSchema.safeParse({
    userId: formData.get("userId"),
    name: formData.get("name"),
    role: formData.get("role"),
    entityId: formData.get("entityId"),
  });

  if (!parsedInput.success) {
    throw new Error(getZodErrorMessage(parsedInput.error));
  }

  const adminClient = createAdminClient();
  const { userId, name, role, entityId } = parsedInput.data;
  const { error } = await adminClient
    .from("users")
    .update({
      name,
      role,
      entity_id: entityId,
      title: role === "admin" ? "Admin" : null,
    })
    .eq("id", userId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/users");
}

export async function deactivateUserAction(formData: FormData) {
  const adminClient = createAdminClient();
  await requireAdmin();

  const userId = String(formData.get("userId") ?? "").trim();

  if (!userId) {
    throw new Error("User id is required.");
  }

  const { error } = await adminClient
    .from("users")
    .update({ active: false })
    .eq("id", userId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/users");
}

export async function createEntityAction(formData: FormData) {
  await requireAdmin();
  const parsedInput = createEntityFormSchema.safeParse({
    name: formData.get("name"),
    type: formData.get("type"),
    gradeLevel: formData.get("gradeLevel"),
  });

  if (!parsedInput.success) {
    throw new Error(getZodErrorMessage(parsedInput.error));
  }

  const supabase = createClient();
  const { name, type, gradeLevel } = parsedInput.data;
  const { error } = await supabase.from("entities").insert({
    name,
    type,
    grade_level: gradeLevel || null,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/entities");
}

export async function updateEntityAction(formData: FormData) {
  await requireAdmin();
  const parsedInput = updateEntityFormSchema.safeParse({
    entityId: formData.get("entityId"),
    name: formData.get("name"),
    type: formData.get("type"),
    gradeLevel: formData.get("gradeLevel"),
    headUserId: formData.get("headUserId"),
  });

  if (!parsedInput.success) {
    throw new Error(getZodErrorMessage(parsedInput.error));
  }

  const supabase = createClient();
  const { entityId, name, type, gradeLevel, headUserId } = parsedInput.data;
  const { error } = await supabase
    .from("entities")
    .update({
      name,
      type,
      grade_level: gradeLevel || null,
      head_user_id: headUserId ?? null,
    })
    .eq("id", entityId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/entities");
}

export async function createFacilityAction(formData: FormData) {
  await requireAdmin();
  const parsedInput = createFacilityFormSchema.safeParse({
    name: formData.get("name"),
    capacity: formData.get("capacity"),
    notes: formData.get("notes"),
  });

  if (!parsedInput.success) {
    throw new Error(getZodErrorMessage(parsedInput.error));
  }

  const supabase = createClient();
  const { name, capacity, notes } = parsedInput.data;
  const { error } = await supabase.from("facilities").insert({
    name,
    capacity: capacity ?? null,
    notes: notes ?? null,
    active: true,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/facilities");
}

export async function updateFacilityAction(formData: FormData) {
  await requireAdmin();
  const parsedInput = updateFacilityFormSchema.safeParse({
    facilityId: formData.get("facilityId"),
    name: formData.get("name"),
    capacity: formData.get("capacity"),
    notes: formData.get("notes"),
  });

  if (!parsedInput.success) {
    throw new Error(getZodErrorMessage(parsedInput.error));
  }

  const supabase = createClient();
  const { facilityId, name, capacity, notes } = parsedInput.data;
  const { error } = await supabase
    .from("facilities")
    .update({
      name,
      capacity: capacity ?? null,
      notes: notes ?? null,
    })
    .eq("id", facilityId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/facilities");
}

export async function deactivateFacilityAction(formData: FormData) {
  const supabase = createClient();
  await requireAdmin();

  const facilityId = String(formData.get("facilityId") ?? "").trim();

  if (!facilityId) {
    throw new Error("Facility id is required.");
  }

  const { error } = await supabase
    .from("facilities")
    .update({ active: false })
    .eq("id", facilityId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/facilities");
}

async function requireAdmin() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Authentication required.");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("role, active")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.active || profile.role !== "admin") {
    throw new Error("Admin access required.");
  }
}

async function findAuthUserByEmail(
  adminClient: ReturnType<typeof createAdminClient>,
  email: string,
) {
  let page = 1;

  while (true) {
    const { data, error } = await adminClient.auth.admin.listUsers({
      page,
      perPage: 100,
    });

    if (error) {
      throw new Error(error.message);
    }

    const match = data.users.find(
      (user) => user.email?.toLowerCase() === email.toLowerCase(),
    );

    if (match) {
      return match;
    }

    if (data.users.length < 100) {
      return null;
    }

    page += 1;
  }
}

function normalizeNullableString(value: FormDataEntryValue | null) {
  const stringValue = String(value ?? "").trim();
  return stringValue.length > 0 ? stringValue : null;
}

function normalizeNullableNumber(value: FormDataEntryValue | null) {
  const stringValue = String(value ?? "").trim();
  if (!stringValue) {
    return null;
  }

  const parsedValue = Number(stringValue);
  return Number.isFinite(parsedValue) ? parsedValue : null;
}
