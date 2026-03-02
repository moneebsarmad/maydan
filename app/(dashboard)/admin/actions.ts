"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  createEntityFormSchema,
  createFacilityFormSchema,
  departmentApprovalChainFormSchema,
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
    title: formData.get("title"),
    entityId: formData.get("entityId"),
  });

  if (!parsedInput.success) {
    throw new Error(getZodErrorMessage(parsedInput.error));
  }

  const adminClient = createAdminClient();
  const {
    name,
    role,
    title,
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
      title: role === "admin" ? "Admin" : title ?? null,
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
    title: formData.get("title"),
    entityId: formData.get("entityId"),
  });

  if (!parsedInput.success) {
    throw new Error(getZodErrorMessage(parsedInput.error));
  }

  const adminClient = createAdminClient();
  const { userId, name, role, title, entityId } = parsedInput.data;
  const titleForRole =
    role === "admin"
      ? "Admin"
      : formData.has("title")
        ? title ?? null
        : await getExistingUserTitle(adminClient, userId);
  const { error } = await adminClient
    .from("users")
    .update({
      name,
      role,
      entity_id: entityId,
      title: titleForRole,
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

export async function upsertDepartmentApprovalChainAction(input: unknown) {
  const adminId = await requireAdmin();
  const parsedInput = departmentApprovalChainFormSchema.safeParse(input);

  if (!parsedInput.success) {
    return {
      success: false as const,
      error: getZodErrorMessage(parsedInput.error),
    };
  }

  const supabase = createClient();
  const { templateId, entityId, gradeLevel, name, active, steps } =
    parsedInput.data;

  const { data: entity, error: entityError } = await supabase
    .from("entities")
    .select("id, name, type, head_user_id")
    .eq("id", entityId)
    .maybeSingle();

  if (entityError || !entity) {
    return {
      success: false as const,
      error: entityError?.message ?? "Department not found.",
    };
  }

  if (entity.type !== "department") {
    return {
      success: false as const,
      error: "Only department entities support configurable approval chains.",
    };
  }

  const specificUserIds = steps
    .map((step) => step.userId)
    .filter((value): value is string => Boolean(value));
  const titleKeys = Array.from(
    new Set(
      steps
        .map((step) => step.titleKey?.trim())
        .filter((value): value is string => Boolean(value)),
    ),
  );

  if (steps.some((step) => step.sourceType === "entity_head") && !entity.head_user_id) {
    return {
      success: false as const,
      error: `${entity.name} does not have an entity head assigned yet.`,
    };
  }

  if (steps.some((step) => step.sourceType === "entity_head") && entity.head_user_id) {
    const { data: headUser, error: headUserError } = await supabase
      .from("users")
      .select("id, active, role")
      .eq("id", entity.head_user_id)
      .maybeSingle();

    if (headUserError) {
      return {
        success: false as const,
        error: headUserError.message,
      };
    }

    if (
      !headUser?.active ||
      (headUser.role !== "approver" && headUser.role !== "admin")
    ) {
      return {
        success: false as const,
        error:
          "The assigned department head must be an active approver or admin.",
      };
    }
  }

  if (specificUserIds.length > 0) {
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id, active, role")
      .in("id", specificUserIds);

    if (usersError) {
      return {
        success: false as const,
        error: usersError.message,
      };
    }

    const validUsers = new Set(
      (users ?? [])
        .filter(
          (user) =>
            user.active && (user.role === "approver" || user.role === "admin"),
        )
        .map((user) => user.id),
    );

    const invalidUserId = specificUserIds.find((userId) => !validUsers.has(userId));

    if (invalidUserId) {
      return {
        success: false as const,
        error:
          "Specific-user steps must target an active admin or approver account.",
      };
    }
  }

  for (const titleKey of titleKeys) {
    const { data: matchingUsers, error: matchingUsersError } = await supabase
      .from("users")
      .select("id")
      .eq("title", titleKey)
      .eq("active", true)
      .in("role", ["approver", "admin"]);

    if (matchingUsersError) {
      return {
        success: false as const,
        error: matchingUsersError.message,
      };
    }

    if ((matchingUsers?.length ?? 0) !== 1) {
      return {
        success: false as const,
        error: `Title lookup "${titleKey}" must resolve to exactly one active admin or approver.`,
      };
    }
  }

  const { data: existingTemplate, error: existingTemplateError } = await supabase
    .from("approval_chain_templates")
    .select("id")
    .eq("entity_id", entityId)
    .eq("grade_level", gradeLevel)
    .maybeSingle();

  if (existingTemplateError) {
    return {
      success: false as const,
      error: existingTemplateError.message,
    };
  }

  if (
    templateId &&
    existingTemplate?.id &&
    existingTemplate.id !== templateId
  ) {
    return {
      success: false as const,
      error: "The selected department chain does not match this slot.",
    };
  }

  let savedTemplateId = templateId ?? existingTemplate?.id ?? undefined;

  if (savedTemplateId) {
    const { error: updateError } = await supabase
      .from("approval_chain_templates")
      .update({
        name,
        entity_id: entityId,
        grade_level: gradeLevel,
        active,
        updated_at: new Date().toISOString(),
      })
      .eq("id", savedTemplateId);

    if (updateError) {
      return {
        success: false as const,
        error: updateError.message,
      };
    }
  } else {
    const { data: insertedTemplate, error: insertError } = await supabase
      .from("approval_chain_templates")
      .insert({
        name,
        entity_id: entityId,
        grade_level: gradeLevel,
        active,
        created_by: adminId,
        updated_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (insertError || !insertedTemplate) {
      return {
        success: false as const,
        error:
          insertError?.message ??
          "Unable to create the department approval chain.",
      };
    }

    savedTemplateId = insertedTemplate.id;
  }

  if (!savedTemplateId) {
    return {
      success: false as const,
      error: "Unable to resolve the saved chain id.",
    };
  }

  const { error: deleteStepsError } = await supabase
    .from("approval_chain_template_steps")
    .delete()
    .eq("template_id", savedTemplateId);

  if (deleteStepsError) {
    return {
      success: false as const,
      error: deleteStepsError.message,
    };
  }

  const { error: insertStepsError } = await supabase
    .from("approval_chain_template_steps")
    .insert(
      steps.map((step, index) => ({
        template_id: savedTemplateId,
        step_number: index + 1,
        source_type: step.sourceType,
        user_id: step.sourceType === "specific_user" ? step.userId ?? null : null,
        title_key:
          step.sourceType === "title_lookup" ? step.titleKey ?? null : null,
        label_override: step.labelOverride ?? null,
        is_blocking: true,
      })),
    );

  if (insertStepsError) {
    return {
      success: false as const,
      error: insertStepsError.message,
    };
  }

  revalidatePath("/admin/approval-chains");

  return {
    success: true as const,
    templateId: savedTemplateId,
    message: active
      ? "Department approval chain saved and activated."
      : "Department approval chain saved as inactive. Live routing will continue using the V1 fallback.",
  };
}

export async function deactivateDepartmentApprovalChainAction(input: unknown) {
  await requireAdmin();
  const templateId = String(
    (input as { templateId?: string } | null)?.templateId ?? "",
  ).trim();

  if (!templateId) {
    return {
      success: false as const,
      error: "Chain id is required.",
    };
  }

  const supabase = createClient();
  const { error } = await supabase
    .from("approval_chain_templates")
    .update({
      active: false,
      updated_at: new Date().toISOString(),
    })
    .eq("id", templateId);

  if (error) {
    return {
      success: false as const,
      error: error.message,
    };
  }

  revalidatePath("/admin/approval-chains");

  return {
    success: true as const,
    message: "Custom routing disabled. Department flow will fall back to V1.",
  };
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

  return user.id;
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

async function getExistingUserTitle(
  adminClient: ReturnType<typeof createAdminClient>,
  userId: string,
) {
  const { data, error } = await adminClient
    .from("users")
    .select("title")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data?.title ?? null;
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
