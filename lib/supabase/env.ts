export const requiredAppEnv = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "RESEND_API_KEY",
  "NEXT_PUBLIC_APP_URL",
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
