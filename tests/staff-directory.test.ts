import assert from "node:assert/strict";
import test from "node:test";
import https from "node:https";
import { getAdminClient, hasLiveSupabaseEnv } from "./live-supabase-helpers";

const hasEnv = hasLiveSupabaseEnv();

const relevantSectionPrefixes = ["MS/HS"];
const leadershipDirectoryEntries = [
  {
    heading: null,
    name: "Leila Kayed",
    title: "HS Principal",
    email: "leila.kayed@bhaprep.org",
    role: "approver",
    entityName: null,
  },
  {
    heading: null,
    name: "Sami Moussa",
    title: "MS Principal",
    email: "smoussa@bhaprep.org",
    role: "approver",
    entityName: null,
  },
  {
    heading: null,
    name: "Moneeb Sarmad",
    title: "Tarbiyah Director",
    email: "moneeb.sarmad@bhaprep.org",
    role: "admin",
    entityName: null,
  },
];

const overridesByEmail: Record<
  string,
  {
    role?: "staff" | "approver" | "viewer" | "admin";
    title?: string;
    entityName?: string | null;
  }
> = {
  "facilities@bhaprep.org": {
    role: "viewer",
    title: "Facilities Director",
    entityName: null,
  },
  "kendra.rumph@bhaprep.org": {
    role: "approver",
    title: "Athletic Director",
    entityName: "Athletics",
  },
  "sundus.khan@bhaprep.org": {
    role: "viewer",
    title: "PR Staff",
    entityName: null,
  },
  "szamir@bhaprep.org": {
    role: "approver",
    title: "Department Head",
    entityName: "Math Department",
  },
  "sana.yusuf@bhaprep.org": {
    role: "approver",
    title: "Department Head",
    entityName: "Science Department",
  },
  "susan.almasri@bhaprep.org": {
    role: "approver",
    title: "Department Head",
    entityName: "English Department",
  },
  "shamsa.ashraf@bhaprep.org": {
    role: "approver",
    title: "Department Head",
    entityName: "Social Studies Department",
  },
  "rsaleh@bhaprep.org": {
    role: "approver",
    title: "Department Head",
    entityName: "Arabic Department",
  },
  "nsahyouni@bhaprep.org": {
    role: "approver",
    title: "Department Head",
    entityName: "HS Islamic Studies Department",
  },
  "rdamrah@bhaprep.org": {
    role: "approver",
    title: "Department Head",
    entityName: "MS Islamic Studies Department",
  },
  "fauzan.plasticwala@bhaprep.org": {
    role: "approver",
    title: "House Mentor",
    entityName: "House of Abu Bakr",
  },
  "msolis@bhaprep.org": {
    role: "approver",
    title: "House Mentor",
    entityName: "House of Khadijah",
  },
  "nora.hamed@bhaprep.org": {
    role: "approver",
    title: "House Mentor",
    entityName: "House of Aishah",
  },
  "hanan.dabaja@bhaprep.org": {
    role: "approver",
    title: "House Mentor",
    entityName: "House of Umar",
  },
};

test("live Supabase includes the in-scope BHA staff directory with expected Maydan roles", { skip: !hasEnv }, async () => {
  const admin = getAdminClient();
  const [directoryEntries, { data: entityRows, error: entityError }] = await Promise.all([
    fetchRelevantDirectoryEntries(),
    admin.from("entities").select("id, name"),
  ]);

  assert.equal(entityError, null);

  const expectedProfiles = dedupeEntriesByEmail(
    [...leadershipDirectoryEntries, ...directoryEntries].map((entry) => {
      const override = overridesByEmail[entry.email] ?? {};

      return {
        email: entry.email,
        name: normalizeName(entry.name),
        role: override.role ?? ("role" in entry ? entry.role : "staff"),
        title: override.title ?? entry.title,
        entityName:
          override.entityName ?? ("entityName" in entry ? entry.entityName : deriveEntityName(entry)),
      };
    }),
  );

  const { data: users, error: usersError } = await admin
    .from("users")
    .select("email, role, title, active, entity_id")
    .in(
      "email",
      expectedProfiles.map((profile) => profile.email),
    );

  assert.equal(usersError, null);

  const userByEmail = new Map((users ?? []).map((user) => [user.email.toLowerCase(), user]));
  const entityIdByName = new Map((entityRows ?? []).map((entity) => [entity.name, entity.id]));

  assert.equal(
    userByEmail.size,
    expectedProfiles.length,
    "Expected every in-scope directory email to exist in public.users.",
  );

  for (const profile of expectedProfiles) {
    const user = userByEmail.get(profile.email);

    assert.ok(user, `Missing user profile for ${profile.email}`);
    assert.equal(user?.active, true, `${profile.email} should be active.`);
    assert.equal(user?.role, profile.role, `${profile.email} should have role ${profile.role}.`);
    assert.equal(user?.title, profile.title, `${profile.email} should have title ${profile.title}.`);
    assert.equal(
      user?.entity_id ?? null,
      profile.entityName ? entityIdByName.get(profile.entityName) ?? null : null,
      `${profile.email} should be assigned to ${profile.entityName ?? "no entity"}.`,
    );
  }
});

async function fetchRelevantDirectoryEntries() {
  const html = await fetchHtml("https://www.bhaprep.org/faculty-staff/");
  const headingRegex = /<h3[^>]*><strong>([\s\S]*?)<\/strong><\/h3>/g;
  const blurbRegex = /<div class="et_pb_blurb_container">([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>/g;
  const tokens: Array<
    | { index: number; type: "heading"; value: string }
    | {
        index: number;
        type: "entry";
        value: { heading: string | null; name: string; title: string; email: string };
      }
  > = [];

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
        heading: null,
        name: decodeHtml(name),
        title: decodeHtml(title),
        email: email.trim().toLowerCase(),
      },
    });
  }

  tokens.sort((left, right) => left.index - right.index);

  let currentHeading: string | null = null;
  const directoryEntries: Array<{ heading: string | null; name: string; title: string; email: string }> = [];

  for (const token of tokens) {
    if (token.type === "heading") {
      currentHeading = token.value;
      continue;
    }

    if (
      currentHeading === null ||
      relevantSectionPrefixes.some((prefix) => currentHeading?.startsWith(prefix))
    ) {
      directoryEntries.push({
        ...token.value,
        heading: currentHeading,
      });
    }
  }

  return directoryEntries;
}

function deriveEntityName(entry: { heading: string | null; title: string }) {
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

function dedupeEntriesByEmail<T extends { email: string }>(entries: T[]) {
  const dedupedEntries = new Map<string, T>();

  for (const entry of entries) {
    dedupedEntries.set(entry.email.toLowerCase(), {
      ...entry,
      email: entry.email.toLowerCase(),
    });
  }

  return [...dedupedEntries.values()];
}

function normalizeName(name: string) {
  return name.replace(/, M\.Ed\./g, "").replace(/^Dr\.\s+/g, "").trim();
}

function decodeHtml(value: string) {
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

function fetchHtml(url: string) {
  return new Promise<string>((resolvePromise, rejectPromise) => {
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
