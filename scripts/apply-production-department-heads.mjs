import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

const TEMP_PASSWORD = "Maydan!Approver123";

const departmentHeadAssignments = [
  {
    entityName: "Arabic Department",
    name: "Rayda Saleh",
    email: "rsaleh@bhaprep.org",
  },
  {
    entityName: "English Department",
    name: "Susan Almasri",
    email: "susan.almasri@bhaprep.org",
  },
  {
    entityName: "Social Studies Department",
    name: "Shamsa Ashraf",
    email: "shamsa.ashraf@bhaprep.org",
  },
  {
    entityName: "HS Islamic Studies Department",
    name: "Nouhad Sahyouni",
    email: "nsahyouni@bhaprep.org",
  },
  {
    entityName: "HS Quran Department",
    name: "Nouhad Sahyouni",
    email: "nsahyouni@bhaprep.org",
  },
  {
    entityName: "MS Islamic Studies Department",
    name: "Rima Damrah",
    email: "rdamrah@bhaprep.org",
  },
  {
    entityName: "MS Quran Department",
    name: "Rima Damrah",
    email: "rdamrah@bhaprep.org",
  },
];

const houseMentorAssignments = [
  {
    entityName: "House of Abu Bakr",
    name: "Fauzan Plasticwala",
    email: "fauzan.plasticwala@bhaprep.org",
  },
  {
    entityName: "House of Khadijah",
    name: "Michelle Solis",
    email: "msolis@bhaprep.org",
  },
  {
    entityName: "House of Aishah",
    name: "Nora Hamed",
    email: "nora.hamed@bhaprep.org",
  },
  {
    entityName: "House of Umar",
    name: "Hanan Dabaja",
    email: "hanan.dabaja@bhaprep.org",
  },
];

const clubAdviserAssignments = [
  {
    entityName: "TED Talk Club",
    name: "Susan Almasri",
    email: "susan.almasri@bhaprep.org",
  },
  {
    entityName: "Chess Club",
    name: "Rayda Saleh",
    email: "rsaleh@bhaprep.org",
  },
];

loadLocalEnv();

const admin = createClient(
  getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
  getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);

async function main() {
  const entityMap = await getEntityMap([
    ...departmentHeadAssignments.map((assignment) => assignment.entityName),
    ...houseMentorAssignments.map((assignment) => assignment.entityName),
    ...clubAdviserAssignments.map((assignment) => assignment.entityName),
    "PE Department",
  ]);
  const athleticDirector = await getUserByTitle("Athletic Director");
  const appliedAssignments = [];

  for (const assignment of departmentHeadAssignments) {
    const authUser = await findOrCreateAuthUser(assignment.email, assignment.name);
    await upsertUserProfile({
      id: authUser.id,
      name: assignment.name,
      email: assignment.email,
      role: "approver",
      title: "Department Head",
      entityId: null,
    });

    await assignEntityHead(entityMap.get(assignment.entityName), authUser.id);
    appliedAssignments.push(`${assignment.entityName} -> ${assignment.name}`);
  }

  for (const assignment of houseMentorAssignments) {
    const authUser = await findOrCreateAuthUser(assignment.email, assignment.name);
    await upsertUserProfile({
      id: authUser.id,
      name: assignment.name,
      email: assignment.email,
      role: "approver",
      title: "House Mentor",
      entityId: null,
    });

    await assignEntityHead(entityMap.get(assignment.entityName), authUser.id);
    appliedAssignments.push(`${assignment.entityName} -> ${assignment.name}`);
  }

  for (const assignment of clubAdviserAssignments) {
    const authUser = await findOrCreateAuthUser(assignment.email, assignment.name);
    await assignEntityHead(entityMap.get(assignment.entityName), authUser.id);
    appliedAssignments.push(`${assignment.entityName} -> ${assignment.name} (temporary)`);
  }

  await assignEntityHead(entityMap.get("PE Department"), athleticDirector.id);
  appliedAssignments.push("PE Department -> Athletic Director");

  console.log(appliedAssignments.join("\n"));
}

async function getEntityMap(names) {
  const { data, error } = await admin
    .from("entities")
    .select("id, name")
    .in("name", names);

  if (error) {
    throw new Error(error.message);
  }

  const entityMap = new Map((data ?? []).map((entity) => [entity.name, entity.id]));

  for (const name of names) {
    if (!entityMap.has(name)) {
      throw new Error(`Entity not found: ${name}`);
    }
  }

  return entityMap;
}

async function getUserByTitle(title) {
  const { data, error } = await admin
    .from("users")
    .select("id, name, email")
    .eq("title", title)
    .maybeSingle();

  if (error || !data) {
    throw new Error(error?.message ?? `User not found for title ${title}`);
  }

  return data;
}

async function findOrCreateAuthUser(email, name) {
  const existing = await findAuthUserByEmail(email);

  if (existing) {
    const { error } = await admin.auth.admin.updateUserById(existing.id, {
      email,
      password: TEMP_PASSWORD,
      email_confirm: true,
      user_metadata: {
        full_name: name,
      },
    });

    if (error) {
      throw new Error(error.message);
    }

    return existing;
  }

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: TEMP_PASSWORD,
    email_confirm: true,
    user_metadata: {
      full_name: name,
    },
  });

  if (error || !data.user) {
    throw new Error(error?.message ?? `Unable to create auth user ${email}`);
  }

  return data.user;
}

async function findAuthUserByEmail(email) {
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

async function upsertUserProfile({ id, name, email, role, title, entityId }) {
  const { error } = await admin.from("users").upsert(
    {
      id,
      name,
      email,
      role,
      title,
      entity_id: entityId,
      active: true,
    },
    { onConflict: "id" },
  );

  if (error) {
    throw new Error(error.message);
  }
}

async function assignEntityHead(entityId, userId) {
  const { error } = await admin
    .from("entities")
    .update({ head_user_id: userId })
    .eq("id", entityId);

  if (error) {
    throw new Error(error.message);
  }
}

function getRequiredEnv(key) {
  const value = process.env[key];

  if (!value) {
    throw new Error(`Missing required env var: ${key}`);
  }

  return value;
}

function loadLocalEnv() {
  const envPath = resolve(process.cwd(), ".env.local");

  if (!existsSync(envPath)) {
    return;
  }

  const envFile = readFileSync(envPath, "utf8");

  for (const line of envFile.split("\n")) {
    const trimmedLine = line.trim();

    if (!trimmedLine || trimmedLine.startsWith("#")) {
      continue;
    }

    const delimiterIndex = trimmedLine.indexOf("=");

    if (delimiterIndex === -1) {
      continue;
    }

    const key = trimmedLine.slice(0, delimiterIndex).trim();
    const value = trimmedLine.slice(delimiterIndex + 1).trim();

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
