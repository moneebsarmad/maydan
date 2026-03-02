export interface MicrosoftCalendarSyncConfig {
  tenantId: string;
  clientId: string;
  clientSecret: string;
  calendarOwner: string;
  calendarId: string | null;
  timeZone: string;
}

export interface SyncableMaydanEvent {
  id: string;
  name: string;
  date: string;
  startTime: string;
  endTime: string;
  description: string | null;
  facilityName: string | null;
  facilityNotes: string | null;
  entityName: string | null;
  gradeLevel: string | null;
  expectedAttendance: number | null;
  staffingNeeds: string | null;
  audience: string[] | null;
}

export interface MicrosoftGraphCalendarEventPayload {
  subject: string;
  body: {
    contentType: "HTML";
    content: string;
  };
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  location: {
    displayName: string;
  };
  categories: string[];
  showAs: "busy";
  transactionId: string;
}

const MICROSOFT_GRAPH_BASE_URL = "https://graph.microsoft.com/v1.0";

export function resolveMicrosoftCalendarEventsEndpoint(
  config: Pick<MicrosoftCalendarSyncConfig, "calendarOwner" | "calendarId">,
  externalEventId?: string | null,
) {
  const ownerSegment = encodeURIComponent(config.calendarOwner);
  const basePath = config.calendarId
    ? `${MICROSOFT_GRAPH_BASE_URL}/users/${ownerSegment}/calendars/${encodeURIComponent(config.calendarId)}/events`
    : `${MICROSOFT_GRAPH_BASE_URL}/users/${ownerSegment}/calendar/events`;

  return externalEventId
    ? `${basePath}/${encodeURIComponent(externalEventId)}`
    : basePath;
}

export function buildMicrosoftGraphEventPayload(
  event: SyncableMaydanEvent,
  options: {
    appUrl: string;
    timeZone: string;
  },
): MicrosoftGraphCalendarEventPayload {
  const appUrl = options.appUrl.trim().replace(/\/$/, "");

  return {
    subject: event.name,
    body: {
      contentType: "HTML",
      content: buildMicrosoftCalendarBodyHtml(event, appUrl),
    },
    start: {
      dateTime: toMicrosoftDateTime(event.date, event.startTime),
      timeZone: options.timeZone,
    },
    end: {
      dateTime: toMicrosoftDateTime(event.date, event.endTime),
      timeZone: options.timeZone,
    },
    location: {
      displayName: event.facilityName ?? "Unassigned facility",
    },
    categories: ["Maydan"],
    showAs: "busy",
    transactionId: event.id,
  };
}

function buildMicrosoftCalendarBodyHtml(
  event: SyncableMaydanEvent,
  appUrl: string,
) {
  const details = [
    ["Entity", event.entityName ?? "Unknown entity"],
    ["Facility", event.facilityName ?? "Unassigned facility"],
    ["Grade level", formatGradeLevel(event.gradeLevel)],
    [
      "Audience",
      event.audience?.length ? event.audience.join(", ") : "Not specified",
    ],
    [
      "Expected attendance",
      event.expectedAttendance !== null
        ? String(event.expectedAttendance)
        : "Not provided",
    ],
    ["Facility notes", event.facilityNotes ?? "None"],
    ["Staffing needs", event.staffingNeeds ?? "None"],
  ];

  const detailsList = details
    .map(
      ([label, value]) =>
        `<li><strong>${escapeHtml(label)}:</strong> ${escapeHtml(value)}</li>`,
    )
    .join("");
  const description = event.description
    ? `<p>${escapeHtml(event.description).replace(/\n/g, "<br />")}</p>`
    : "<p>No additional description provided in Maydan.</p>";

  return [
    "<p>This event was approved in Maydan and synced automatically.</p>",
    description,
    `<ul>${detailsList}</ul>`,
    `<p><a href="${escapeHtml(`${appUrl}/events/${event.id}`)}">Open this event in Maydan</a></p>`,
  ].join("");
}

function toMicrosoftDateTime(date: string, time: string) {
  const trimmedTime = time.trim();

  if (/^\d{2}:\d{2}$/.test(trimmedTime)) {
    return `${date}T${trimmedTime}:00`;
  }

  if (/^\d{2}:\d{2}:\d{2}$/.test(trimmedTime)) {
    return `${date}T${trimmedTime}`;
  }

  throw new Error(`Invalid event time for Outlook sync: "${time}".`);
}

function formatGradeLevel(value: string | null) {
  if (value === "Both") {
    return "MS + HS";
  }

  return value ?? "Not specified";
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
