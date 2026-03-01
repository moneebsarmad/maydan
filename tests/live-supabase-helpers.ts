import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { randomUUID } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const requiredEnvKeys = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
] as const;

export const TEST_PASSWORD = "Maydan!Test1234";
export const SECONDARY_SUBMITTER_EMAIL = "maydan.math.submitter@bhaprep.org";

type RequiredEnvKey = (typeof requiredEnvKeys)[number];

interface AppUser {
  id: string;
  email: string;
}

export interface LiveFixtureSet {
  admin: SupabaseClient;
  submitter: {
    client: SupabaseClient;
    user: AppUser;
  };
  secondarySubmitter: {
    client: SupabaseClient;
    user: AppUser;
  };
  approver: {
    client: SupabaseClient;
    user: AppUser;
  };
  facilities: {
    client: SupabaseClient;
    user: AppUser;
  };
}

export function hasLiveSupabaseEnv() {
  loadLocalEnv();
  return requiredEnvKeys.every((key) => Boolean(process.env[key]));
}

export function getAdminClient() {
  return createClient(
    getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
    getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}

export async function signIn(email: string) {
  const client = createClient(
    getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
    getRequiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );

  const { data, error } = await client.auth.signInWithPassword({
    email,
    password: TEST_PASSWORD,
  });

  if (error || !data.user) {
    throw new Error(error?.message ?? `Unable to sign in ${email}.`);
  }

  return {
    client,
    user: {
      id: data.user.id,
      email,
    },
  };
}

export async function buildLiveFixtures(): Promise<LiveFixtureSet> {
  const admin = getAdminClient();

  await ensureSecondarySubmitter(admin);

  const [submitter, secondarySubmitter, approver, facilities] =
    await Promise.all([
      signIn("maydan.hosa.submitter@bhaprep.org"),
      signIn(SECONDARY_SUBMITTER_EMAIL),
      signIn("maydan.hosa.adviser@bhaprep.org"),
      signIn("maydan.facilities@bhaprep.org"),
    ]);

  return {
    admin,
    submitter,
    secondarySubmitter,
    approver,
    facilities,
  };
}

export async function createEventForUser(params: {
  admin: SupabaseClient;
  submitterId: string;
  entityName: string;
  facilityName?: string;
  status?: "draft" | "pending" | "needs_revision" | "approved" | "cancelled";
  currentStep?: number;
  namePrefix: string;
}) {
  const facility = await getFacilityByName(
    params.admin,
    params.facilityName ?? "Auditorium",
  );
  const entity = await getEntityByName(params.admin, params.entityName);

  const { data, error } = await params.admin
    .from("events")
    .insert({
      name: `${params.namePrefix} ${randomUUID()}`,
      date: "2026-03-20",
      start_time: "10:00",
      end_time: "11:00",
      facility_id: facility.id,
      description: "Live RLS audit event",
      audience: ["Students"],
      grade_level: "HS",
      expected_attendance: 30,
      staffing_needs: "None",
      marketing_needed: false,
      status: params.status ?? "pending",
      submitter_id: params.submitterId,
      entity_id: entity.id,
      current_step: params.currentStep ?? 1,
    })
    .select("id, name")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Unable to create test event.");
  }

  return data;
}

export async function createApprovalStep(params: {
  admin: SupabaseClient;
  eventId: string;
  approverId: string;
  stepNumber: number;
  status?: "pending" | "approved" | "rejected";
}) {
  const { data, error } = await params.admin
    .from("approval_steps")
    .insert({
      event_id: params.eventId,
      approver_id: params.approverId,
      step_number: params.stepNumber,
      status: params.status ?? "pending",
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Unable to create test approval step.");
  }

  return data;
}

export async function cleanupEvents(admin: SupabaseClient, eventIds: string[]) {
  if (eventIds.length === 0) {
    return;
  }

  await admin.from("notifications").delete().in("event_id", eventIds);
  await admin.from("facility_conflicts").delete().in("event_id", eventIds);
  await admin.from("marketing_requests").delete().in("event_id", eventIds);
  await admin.from("approval_steps").delete().in("event_id", eventIds);
  await admin.from("events").delete().in("id", eventIds);
}

async function ensureSecondarySubmitter(admin: SupabaseClient) {
  const authUser = await findOrCreateAuthUser(
    admin,
    SECONDARY_SUBMITTER_EMAIL,
    "Math Submitter",
  );
  const mathEntity = await getEntityByName(admin, "Math Department");

  const { error } = await admin.from("users").upsert(
    {
      id: authUser.id,
      name: "Math Submitter",
      email: SECONDARY_SUBMITTER_EMAIL,
      role: "staff",
      title: null,
      entity_id: mathEntity.id,
      active: true,
    },
    { onConflict: "id" },
  );

  if (error) {
    throw new Error(error.message);
  }
}

async function findOrCreateAuthUser(
  admin: SupabaseClient,
  email: string,
  name: string,
) {
  const existing = await findAuthUserByEmail(admin, email);

  if (existing) {
    const { error } = await admin.auth.admin.updateUserById(existing.id, {
      password: TEST_PASSWORD,
      email_confirm: true,
    });

    if (error) {
      throw new Error(error.message);
    }

    return existing;
  }

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: TEST_PASSWORD,
    email_confirm: true,
    user_metadata: {
      full_name: name,
    },
  });

  if (error || !data.user) {
    throw new Error(error?.message ?? `Unable to create auth user ${email}.`);
  }

  return data.user;
}

async function findAuthUserByEmail(admin: SupabaseClient, email: string) {
  let page = 1;

  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({
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

async function getEntityByName(admin: SupabaseClient, name: string) {
  const { data, error } = await admin
    .from("entities")
    .select("id, name")
    .eq("name", name)
    .maybeSingle();

  if (error || !data) {
    throw new Error(error?.message ?? `Entity not found: ${name}`);
  }

  return data;
}

async function getFacilityByName(admin: SupabaseClient, name: string) {
  const { data, error } = await admin
    .from("facilities")
    .select("id, name")
    .eq("name", name)
    .maybeSingle();

  if (error || !data) {
    throw new Error(error?.message ?? `Facility not found: ${name}`);
  }

  return data;
}

function getRequiredEnv(key: RequiredEnvKey) {
  loadLocalEnv();
  const value = process.env[key];

  if (!value) {
    throw new Error(`Missing required env var: ${key}`);
  }

  return value;
}

let envLoaded = false;

function loadLocalEnv() {
  if (envLoaded) {
    return;
  }

  const envPath = resolve(process.cwd(), ".env.local");

  if (!existsSync(envPath)) {
    envLoaded = true;
    return;
  }

  const envFile = readFileSync(envPath, "utf8");

  for (const line of envFile.split("\n")) {
    const trimmedLine = line.trim();

    if (!trimmedLine || trimmedLine.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmedLine.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmedLine.slice(0, separatorIndex).trim();
    const rawValue = trimmedLine.slice(separatorIndex + 1).trim();

    if (!process.env[key]) {
      process.env[key] = stripWrappingQuotes(rawValue);
    }
  }

  envLoaded = true;
}

function stripWrappingQuotes(value: string) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  return value;
}
