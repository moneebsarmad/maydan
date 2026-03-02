import { existsSync, readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import https from "node:https";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

const relevantSectionPrefixes = ["MS/HS"];
const leadershipDirectoryEntries = [
  {
    heading: null,
    name: "Dr. Leila Kayed",
    title: "High School Principal",
    email: "leila.kayed@bhaprep.org",
  },
  {
    heading: null,
    name: "Sami Moussa, M.Ed.",
    title: "Middle School Principal",
    email: "smoussa@bhaprep.org",
  },
  {
    heading: null,
    name: "Moneeb Sarmad, M.Ed.",
    title: "Director of Tarbiyah",
    email: "moneeb.sarmad@bhaprep.org",
  },
];

const directoryOverridesByEmail = {
  "moneeb.sarmad@bhaprep.org": {
    role: "admin",
    title: "Tarbiyah Director",
    entityName: null,
    uniqueTitle: "Tarbiyah Director",
  },
  "leila.kayed@bhaprep.org": {
    role: "approver",
    title: "HS Principal",
    entityName: null,
    uniqueTitle: "HS Principal",
  },
  "smoussa@bhaprep.org": {
    role: "approver",
    title: "MS Principal",
    entityName: null,
    uniqueTitle: "MS Principal",
  },
  "facilities@bhaprep.org": {
    role: "viewer",
    title: "Facilities Director",
    entityName: null,
    uniqueTitle: "Facilities Director",
  },
  "kendra.rumph@bhaprep.org": {
    role: "approver",
    title: "Athletic Director",
    entityName: "Athletics",
    uniqueTitle: "Athletic Director",
    replaceEntityHead: false,
  },
  "sundus.khan@bhaprep.org": {
    role: "admin",
    title: "PR Staff",
    entityName: null,
    uniqueTitle: "PR Staff",
  },
  "szamir@bhaprep.org": {
    role: "approver",
    title: "Department Head",
    entityName: "Math Department",
    replaceEntityHead: true,
    replacementEntityName: "Math Department",
    replacementTitle: "Department Head",
  },
  "sana.yusuf@bhaprep.org": {
    role: "approver",
    title: "Department Head",
    entityName: "Science Department",
    replaceEntityHead: true,
    replacementEntityName: "Science Department",
    replacementTitle: "Department Head",
  },
  "susan.almasri@bhaprep.org": {
    role: "approver",
    title: "Department Head",
    entityName: "English Department",
    replaceEntityHead: true,
  },
  "shamsa.ashraf@bhaprep.org": {
    role: "approver",
    title: "Department Head",
    entityName: "Social Studies Department",
    replaceEntityHead: true,
  },
  "rsaleh@bhaprep.org": {
    role: "approver",
    title: "Department Head",
    entityName: "Arabic Department",
    replaceEntityHead: true,
  },
  "nsahyouni@bhaprep.org": {
    role: "approver",
    title: "Department Head",
    entityName: "HS Islamic Studies Department",
    replaceEntityHead: true,
  },
  "rdamrah@bhaprep.org": {
    role: "approver",
    title: "Department Head",
    entityName: "MS Islamic Studies Department",
    replaceEntityHead: true,
  },
  "fauzan.plasticwala@bhaprep.org": {
    role: "approver",
    title: "House Mentor",
    entityName: "House of Abu Bakr",
    replaceEntityHead: true,
    replacementEntityName: "House of Abu Bakr",
    replacementTitle: "House Mentor",
  },
  "msolis@bhaprep.org": {
    role: "approver",
    title: "House Mentor",
    entityName: "House of Khadijah",
    replaceEntityHead: true,
  },
  "nora.hamed@bhaprep.org": {
    role: "approver",
    title: "House Mentor",
    entityName: "House of Aishah",
    replaceEntityHead: true,
  },
  "hanan.dabaja@bhaprep.org": {
    role: "approver",
    title: "House Mentor",
    entityName: "House of Umar",
    replaceEntityHead: true,
  },
};

const archivedTitleSuffix = " (archived placeholder)";

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
  const directoryEntries = await fetchRelevantDirectoryEntries();
  const dedupedEntries = dedupeEntriesByEmail(directoryEntries);
  const entityMap = await getEntityMap();

  for (const entry of dedupedEntries) {
    const mapped = mapDirectoryEntryToMaydanProfile(entry);
    const entityId = mapped.entityName ? getRequiredEntityId(entityMap, mapped.entityName) : null;
    const authUser = await findOrProvisionAuthUser(mapped, entityMap);

    await upsertUserProfile({
      id: authUser.id,
      name: mapped.name,
      email: mapped.email,
      role: mapped.role,
      title: mapped.title,
      entityId,
    });

    if (mapped.uniqueTitle) {
      await archiveDuplicateTitleUsers(mapped.uniqueTitle, authUser.id);
    }

    if (mapped.replaceEntityHead && mapped.entityName) {
      await assignEntityHead(entityId, authUser.id);
    }
  }

  console.log(`Synced ${dedupedEntries.length} in-scope BHA staff accounts.`);
}

async function fetchRelevantDirectoryEntries() {
  const html = await fetchHtml("https://www.bhaprep.org/faculty-staff/");
  const headingRegex = /<h3[^>]*><strong>([\s\S]*?)<\/strong><\/h3>/g;
  const blurbRegex = /<div class="et_pb_blurb_container">([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>/g;
  const tokens = [];

  for (const match of html.matchAll(headingRegex)) {
    tokens.push({
      index: match.index ?? 0,
      type: "heading",
      value: decodeHtml(match[1]),
    });
  }

  for (const match of html.matchAll(blurbRegex)) {
    const block = match[1];
    const name = /<h2 class="et_pb_module_header"><span>([\s\S]*?)<\/span><\/h2>/.exec(block)?.[1];
    const title = /<i>([\s\S]*?)<\/i>/.exec(block)?.[1];
    const email = /mailto:([^"']+)/.exec(block)?.[1];

    if (!name || !title || !email) {
      continue;
    }

    tokens.push({
      index: match.index ?? 0,
      type: "entry",
      value: {
        name: decodeHtml(name),
        title: decodeHtml(title),
        email: email.trim().toLowerCase(),
      },
    });
  }

  tokens.sort((left, right) => left.index - right.index);

  let currentHeading = null;
  const directoryEntries = [...leadershipDirectoryEntries];

  for (const token of tokens) {
    if (token.type === "heading") {
      currentHeading = token.value;
      continue;
    }

    if (
      currentHeading === null ||
      relevantSectionPrefixes.some((prefix) => currentHeading.startsWith(prefix))
    ) {
      directoryEntries.push({
        heading: currentHeading,
        ...token.value,
      });
    }
  }

  return directoryEntries;
}

function mapDirectoryEntryToMaydanProfile(entry) {
  const override = directoryOverridesByEmail[entry.email] ?? {};

  return {
    name: normalizeName(entry.name),
    email: entry.email,
    role: override.role ?? "staff",
    title: override.title ?? entry.title,
    entityName: override.entityName ?? deriveEntityName(entry),
    uniqueTitle: override.uniqueTitle ?? null,
    replaceEntityHead: override.replaceEntityHead ?? false,
    replacementEntityName: override.replacementEntityName ?? null,
    replacementTitle: override.replacementTitle ?? null,
  };
}

function deriveEntityName(entry) {
  switch (entry.heading) {
    case "MS/HS Math":
      return "Math Department";
    case "MS/HS Science":
      return "Science Department";
    case "MS/HS English":
      return "English Department";
    case "MS/HS Social Studies":
      return "Social Studies Department";
    case "MS/HS Arabic":
      return "Arabic Department";
    case "MS/HS Islamic Studies & Quran":
      if (entry.title.startsWith("HS ")) {
        return "HS Islamic Studies Department";
      }

      if (entry.title.startsWith("MS ")) {
        return "MS Islamic Studies Department";
      }

      return null;
    case "MS/HS Specials":
      return entry.title === "PE Teacher" ? "PE Department" : null;
    default:
      return null;
  }
}

async function findOrProvisionAuthUser(mapped, entityMap) {
  const existingByEmail = await findAuthUserByEmail(mapped.email);

  if (existingByEmail) {
    return existingByEmail;
  }

  if (mapped.uniqueTitle) {
    const placeholder = await findProfileByTitle(mapped.uniqueTitle);

    if (placeholder) {
      await updateAuthUserIdentity(placeholder.id, mapped.name, mapped.email);
      return { id: placeholder.id };
    }
  }

  if (mapped.replacementEntityName && mapped.replacementTitle) {
    const placeholder = await findProfileByEntityAndTitle(
      getRequiredEntityId(entityMap, mapped.replacementEntityName),
      mapped.replacementTitle,
    );

    if (placeholder) {
      await updateAuthUserIdentity(placeholder.id, mapped.name, mapped.email);
      return { id: placeholder.id };
    }
  }

  const { data, error } = await admin.auth.admin.createUser({
    email: mapped.email,
    password: `Maydan!${randomUUID()}`,
    email_confirm: true,
    user_metadata: {
      full_name: mapped.name,
    },
  });

  if (error || !data.user) {
    throw new Error(error?.message ?? `Unable to create auth user ${mapped.email}.`);
  }

  return data.user;
}

async function updateAuthUserIdentity(userId, name, email) {
  const { error } = await admin.auth.admin.updateUserById(userId, {
    email,
    password: `Maydan!${randomUUID()}`,
    email_confirm: true,
    user_metadata: {
      full_name: name,
    },
  });

  if (error) {
    throw new Error(error.message);
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

async function archiveDuplicateTitleUsers(title, keepUserId) {
  const { data, error } = await admin
    .from("users")
    .select("id")
    .eq("title", title)
    .neq("id", keepUserId);

  if (error) {
    throw new Error(error.message);
  }

  if (!data?.length) {
    return;
  }

  for (const user of data) {
    const { error: updateError } = await admin
      .from("users")
      .update({
        active: false,
        title: `${title}${archivedTitleSuffix}`,
        entity_id: null,
      })
      .eq("id", user.id);

    if (updateError) {
      throw new Error(updateError.message);
    }
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

async function findProfileByTitle(title) {
  const { data, error } = await admin
    .from("users")
    .select("id")
    .eq("title", title)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

async function findProfileByEntityAndTitle(entityId, title) {
  const { data, error } = await admin
    .from("users")
    .select("id")
    .eq("entity_id", entityId)
    .eq("title", title)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

async function getEntityMap() {
  const { data, error } = await admin
    .from("entities")
    .select("id, name");

  if (error) {
    throw new Error(error.message);
  }

  return new Map((data ?? []).map((entity) => [entity.name, entity.id]));
}

function getRequiredEntityId(entityMap, entityName) {
  const entityId = entityMap.get(entityName);

  if (!entityId) {
    throw new Error(`Entity not found: ${entityName}`);
  }

  return entityId;
}

function dedupeEntriesByEmail(entries) {
  const dedupedEntries = new Map();

  for (const entry of entries) {
    dedupedEntries.set(entry.email.toLowerCase(), {
      ...entry,
      email: entry.email.toLowerCase(),
    });
  }

  return [...dedupedEntries.values()];
}

function normalizeName(name) {
  return name.replace(/, M\.Ed\./g, "").replace(/^Dr\.\s+/g, "").trim();
}

function decodeHtml(value) {
  return value
    .replace(/&#8217;/g, "'")
    .replace(/&#038;/g, "&")
    .replace(/&#8211;/g, "-")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function fetchHtml(url) {
  return new Promise((resolvePromise, rejectPromise) => {
    https
      .get(url, (response) => {
        let html = "";
        response.on("data", (chunk) => {
          html += chunk;
        });
        response.on("end", () => resolvePromise(html));
      })
      .on("error", rejectPromise);
  });
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
