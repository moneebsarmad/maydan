export const requiredAppEnv = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "RESEND_API_KEY",
  "NEXT_PUBLIC_APP_URL",
] as const;

export const requiredMicrosoftCalendarEnv = [
  "MICROSOFT_GRAPH_TENANT_ID",
  "MICROSOFT_GRAPH_CLIENT_ID",
  "MICROSOFT_GRAPH_CLIENT_SECRET",
  "MICROSOFT_GRAPH_CALENDAR_OWNER",
] as const;

export function normalizeEnvValue(value?: string | null) {
  if (!value) {
    return "";
  }

  let normalized = value.trim();

  if (
    (normalized.startsWith('"') && normalized.endsWith('"')) ||
    (normalized.startsWith("'") && normalized.endsWith("'"))
  ) {
    normalized = normalized.slice(1, -1).trim();
  }

  return normalized.replace(/,+$/, "").trim();
}

export const configuredAppEnvCount = requiredAppEnv.filter(
  (key) => Boolean(normalizeEnvValue(process.env[key])),
).length;

export function isSupabaseConfigured() {
  return Boolean(
    normalizeEnvValue(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
      normalizeEnvValue(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  );
}

export function getSupabaseUrl() {
  const supabaseUrl = normalizeEnvValue(process.env.NEXT_PUBLIC_SUPABASE_URL);

  if (!supabaseUrl) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL.");
  }

  try {
    return new URL(supabaseUrl).toString().replace(/\/$/, "");
  } catch {
    throw new Error(
      "Invalid NEXT_PUBLIC_SUPABASE_URL. Check the deployed environment value in Vercel.",
    );
  }
}

export function getSupabaseAnonKey() {
  const supabaseAnonKey = normalizeEnvValue(
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );

  if (!supabaseAnonKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  }

  return supabaseAnonKey;
}

export function getSupabaseServiceRoleKey() {
  const serviceRoleKey = normalizeEnvValue(process.env.SUPABASE_SERVICE_ROLE_KEY);

  if (!serviceRoleKey) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY.");
  }

  return serviceRoleKey;
}

export function hasAnyMicrosoftCalendarSyncEnv() {
  return requiredMicrosoftCalendarEnv.some((key) =>
    Boolean(normalizeEnvValue(process.env[key])),
  );
}

export function isMicrosoftCalendarSyncConfigured() {
  return requiredMicrosoftCalendarEnv.every((key) =>
    Boolean(normalizeEnvValue(process.env[key])),
  );
}

export function getMicrosoftGraphTenantId() {
  return getRequiredMicrosoftCalendarEnv(
    "MICROSOFT_GRAPH_TENANT_ID",
    "Missing MICROSOFT_GRAPH_TENANT_ID.",
  );
}

export function getMicrosoftGraphClientId() {
  return getRequiredMicrosoftCalendarEnv(
    "MICROSOFT_GRAPH_CLIENT_ID",
    "Missing MICROSOFT_GRAPH_CLIENT_ID.",
  );
}

export function getMicrosoftGraphClientSecret() {
  return getRequiredMicrosoftCalendarEnv(
    "MICROSOFT_GRAPH_CLIENT_SECRET",
    "Missing MICROSOFT_GRAPH_CLIENT_SECRET.",
  );
}

export function getMicrosoftGraphCalendarOwner() {
  return getRequiredMicrosoftCalendarEnv(
    "MICROSOFT_GRAPH_CALENDAR_OWNER",
    "Missing MICROSOFT_GRAPH_CALENDAR_OWNER.",
  );
}

export function getMicrosoftGraphCalendarId() {
  return normalizeEnvValue(process.env.MICROSOFT_GRAPH_CALENDAR_ID) || null;
}

export function getMicrosoftGraphTimeZone() {
  return (
    normalizeEnvValue(process.env.MICROSOFT_GRAPH_TIME_ZONE) ||
    "Central Standard Time"
  );
}

function getRequiredMicrosoftCalendarEnv(
  key: (typeof requiredMicrosoftCalendarEnv)[number],
  errorMessage: string,
) {
  const value = normalizeEnvValue(process.env[key]);

  if (!value) {
    throw new Error(errorMessage);
  }

  return value;
}
