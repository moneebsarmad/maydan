import { createAdminClient } from "@/lib/supabase/admin";
import {
  getMicrosoftGraphCalendarId,
  getMicrosoftGraphCalendarOwner,
  getMicrosoftGraphClientId,
  getMicrosoftGraphClientSecret,
  getMicrosoftGraphTenantId,
  getMicrosoftGraphTimeZone,
  hasAnyMicrosoftCalendarSyncEnv,
  isMicrosoftCalendarSyncConfigured,
  normalizeEnvValue,
} from "@/lib/supabase/env";
import {
  buildMicrosoftGraphEventPayload,
  resolveMicrosoftCalendarEventsEndpoint,
  type MicrosoftCalendarSyncConfig,
  type MicrosoftGraphCalendarEventPayload,
  type SyncableMaydanEvent,
} from "@/lib/microsoft/calendar-sync-shared";

const MICROSOFT_GRAPH_SCOPE = "https://graph.microsoft.com/.default";
const MICROSOFT_SYNC_PROVIDER = "microsoft_outlook";

type JoinedRecord<T> = T | T[] | null;

interface EventCalendarSyncRecord {
  event_id: string;
  external_event_id: string | null;
  calendar_owner: string;
  calendar_id: string | null;
}

interface MicrosoftGraphEventResponse {
  id?: string;
}

export async function syncApprovedEventToMicrosoftCalendar(eventId: string) {
  const config = getMicrosoftCalendarSyncConfig();

  if (!config) {
    return {
      status: "disabled" as const,
    };
  }

  const admin = createAdminClient();
  const event = await getSyncableMaydanEvent(admin, eventId);

  if (event.status !== "approved") {
    throw new Error(
      `Only approved events can be synced to Outlook. Received status "${event.status}".`,
    );
  }

  const existingSync = await getEventCalendarSyncRecord(admin, eventId);
  const payload = buildMicrosoftGraphEventPayload(event, {
    appUrl: normalizeEnvValue(process.env.NEXT_PUBLIC_APP_URL) || "http://localhost:3000",
    timeZone: config.timeZone,
  });

  try {
    const accessToken = await getMicrosoftGraphAccessToken(config);
    const externalEventId = existingSync?.external_event_id
      ? await updateMicrosoftCalendarEvent({
          accessToken,
          config,
          existingSync,
          payload,
        })
      : await createMicrosoftCalendarEvent({
          accessToken,
          config,
          payload,
        });

    await persistSuccessfulCalendarSync(admin, {
      eventId,
      externalEventId,
      config,
    });

    return {
      status: "synced" as const,
      externalEventId,
    };
  } catch (error) {
    await persistFailedCalendarSync(
      admin,
      eventId,
      config,
      error instanceof Error ? error.message : "Unknown Microsoft calendar sync failure.",
      existingSync?.external_event_id ?? null,
    );
    throw error;
  }
}

export function getMicrosoftCalendarSyncConfig(): MicrosoftCalendarSyncConfig | null {
  if (!hasAnyMicrosoftCalendarSyncEnv()) {
    return null;
  }

  if (!isMicrosoftCalendarSyncConfigured()) {
    throw new Error(
      "Microsoft calendar sync is partially configured. Set MICROSOFT_GRAPH_TENANT_ID, MICROSOFT_GRAPH_CLIENT_ID, MICROSOFT_GRAPH_CLIENT_SECRET, and MICROSOFT_GRAPH_CALENDAR_OWNER.",
    );
  }

  return {
    tenantId: getMicrosoftGraphTenantId(),
    clientId: getMicrosoftGraphClientId(),
    clientSecret: getMicrosoftGraphClientSecret(),
    calendarOwner: getMicrosoftGraphCalendarOwner(),
    calendarId: getMicrosoftGraphCalendarId(),
    timeZone: getMicrosoftGraphTimeZone(),
  };
}

async function getSyncableMaydanEvent(
  admin: ReturnType<typeof createAdminClient>,
  eventId: string,
) {
  const { data, error } = await admin
    .from("events")
    .select(
      `
        id,
        name,
        date,
        start_time,
        end_time,
        description,
        facility_notes,
        audience,
        grade_level,
        expected_attendance,
        staffing_needs,
        status,
        facility:facilities!events_facility_id_fkey(name),
        entity:entities!events_entity_id_fkey(name)
      `,
    )
    .eq("id", eventId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("Approved event could not be loaded for Outlook sync.");
  }

  const facility = normalizeJoin(data.facility);
  const entity = normalizeJoin(data.entity);

  return {
    id: data.id,
    name: data.name,
    date: data.date,
    startTime: data.start_time,
    endTime: data.end_time,
    description: data.description ?? null,
    facilityName: facility?.name ?? null,
    facilityNotes: data.facility_notes ?? null,
    entityName: entity?.name ?? null,
    gradeLevel: data.grade_level ?? null,
    expectedAttendance: data.expected_attendance ?? null,
    staffingNeeds: data.staffing_needs ?? null,
    audience: data.audience ?? null,
    status: data.status ?? "draft",
  };
}

async function getEventCalendarSyncRecord(
  admin: ReturnType<typeof createAdminClient>,
  eventId: string,
) {
  const { data, error } = await admin
    .from("event_calendar_syncs")
    .select("event_id, external_event_id, calendar_owner, calendar_id")
    .eq("event_id", eventId)
    .eq("provider", MICROSOFT_SYNC_PROVIDER)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as EventCalendarSyncRecord | null;
}

async function persistSuccessfulCalendarSync(
  admin: ReturnType<typeof createAdminClient>,
  input: {
    eventId: string;
    externalEventId: string;
    config: MicrosoftCalendarSyncConfig;
  },
) {
  const timestamp = new Date().toISOString();
  const { error } = await admin.from("event_calendar_syncs").upsert(
    {
      event_id: input.eventId,
      provider: MICROSOFT_SYNC_PROVIDER,
      calendar_owner: input.config.calendarOwner,
      calendar_id: input.config.calendarId,
      external_event_id: input.externalEventId,
      sync_status: "synced",
      last_error: null,
      last_synced_at: timestamp,
      updated_at: timestamp,
    },
    {
      onConflict: "event_id,provider",
    },
  );

  if (error) {
    throw new Error(error.message);
  }
}

async function persistFailedCalendarSync(
  admin: ReturnType<typeof createAdminClient>,
  eventId: string,
  config: MicrosoftCalendarSyncConfig,
  errorMessage: string,
  externalEventId: string | null,
) {
  const timestamp = new Date().toISOString();
  const { error } = await admin.from("event_calendar_syncs").upsert(
    {
      event_id: eventId,
      provider: MICROSOFT_SYNC_PROVIDER,
      calendar_owner: config.calendarOwner,
      calendar_id: config.calendarId,
      external_event_id: externalEventId,
      sync_status: "failed",
      last_error: errorMessage,
      updated_at: timestamp,
    },
    {
      onConflict: "event_id,provider",
    },
  );

  if (error) {
    console.error("[non-critical] microsoft calendar sync persistence", error);
  }
}

async function getMicrosoftGraphAccessToken(config: MicrosoftCalendarSyncConfig) {
  const response = await fetch(
    `https://login.microsoftonline.com/${encodeURIComponent(config.tenantId)}/oauth2/v2.0/token`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        scope: MICROSOFT_GRAPH_SCOPE,
        grant_type: "client_credentials",
      }),
    },
  );

  const payload = await parseJsonResponse<{ access_token?: string }>(response);

  if (!response.ok || !payload?.access_token) {
    throw new Error(
      formatMicrosoftGraphError(
        "Unable to obtain a Microsoft Graph access token.",
        payload,
      ),
    );
  }

  return payload.access_token;
}

async function createMicrosoftCalendarEvent(input: {
  accessToken: string;
  config: MicrosoftCalendarSyncConfig;
  payload: MicrosoftGraphCalendarEventPayload;
}) {
  const response = await fetch(
    resolveMicrosoftCalendarEventsEndpoint(input.config),
    {
      method: "POST",
      headers: buildMicrosoftGraphHeaders(input.accessToken),
      body: JSON.stringify(input.payload),
    },
  );
  const payload = await parseJsonResponse<MicrosoftGraphEventResponse>(response);

  if (!response.ok || !payload?.id) {
    throw new Error(
      formatMicrosoftGraphError("Unable to create the Outlook calendar event.", payload),
    );
  }

  return payload.id;
}

async function updateMicrosoftCalendarEvent(input: {
  accessToken: string;
  config: MicrosoftCalendarSyncConfig;
  existingSync: EventCalendarSyncRecord;
  payload: MicrosoftGraphCalendarEventPayload;
}) {
  const response = await fetch(
    resolveMicrosoftCalendarEventsEndpoint(
      {
        calendarOwner: input.config.calendarOwner,
        calendarId: input.config.calendarId,
      },
      input.existingSync.external_event_id,
    ),
    {
      method: "PATCH",
      headers: buildMicrosoftGraphHeaders(input.accessToken),
      body: JSON.stringify(input.payload),
    },
  );

  if (response.status === 404) {
    return createMicrosoftCalendarEvent({
      accessToken: input.accessToken,
      config: input.config,
      payload: input.payload,
    });
  }

  if (!response.ok) {
    const payload = await parseJsonResponse<Record<string, unknown>>(response);
    throw new Error(
      formatMicrosoftGraphError("Unable to update the Outlook calendar event.", payload),
    );
  }

  return input.existingSync.external_event_id ?? input.payload.transactionId;
}

function buildMicrosoftGraphHeaders(accessToken: string) {
  return {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  };
}

function normalizeJoin<T>(value: JoinedRecord<T>) {
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

async function parseJsonResponse<T>(response: Response) {
  const text = await response.text();

  if (!text) {
    return null as T | null;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    return null as T | null;
  }
}

function formatMicrosoftGraphError(
  fallbackMessage: string,
  payload: unknown,
) {
  const error =
    payload && typeof payload === "object" && "error" in payload
      ? payload.error
      : null;

  if (error && typeof error === "object") {
    const message =
      "message" in error && typeof error.message === "string"
        ? error.message
        : null;
    const code =
      "code" in error && typeof error.code === "string" ? error.code : null;

    if (code && message) {
      return `${fallbackMessage} ${code}: ${message}`;
    }

    if (message) {
      return `${fallbackMessage} ${message}`;
    }
  }

  return fallbackMessage;
}
