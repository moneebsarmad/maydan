import assert from "node:assert/strict";
import test from "node:test";
import {
  buildMicrosoftGraphEventPayload,
  resolveMicrosoftCalendarEventsEndpoint,
  type MicrosoftCalendarSyncConfig,
  type SyncableMaydanEvent,
} from "../lib/microsoft/calendar-sync-shared";

const baseConfig: MicrosoftCalendarSyncConfig = {
  tenantId: "tenant-id",
  clientId: "client-id",
  clientSecret: "client-secret",
  calendarOwner: "calendar@bhaprep.org",
  calendarId: null,
  timeZone: "Central Standard Time",
};

const baseEvent: SyncableMaydanEvent = {
  id: "6ca3f1d2-7f21-4fd6-bf84-79fe1d7101af",
  name: "English Department Assembly",
  date: "2026-03-05",
  startTime: "09:15",
  endTime: "10:00",
  description: "Assembly for grade-level announcements.",
  facilityName: "Auditorium",
  facilityNotes: "Mic check at 8:45 AM",
  entityName: "English Department",
  gradeLevel: "HS",
  expectedAttendance: 180,
  staffingNeeds: "Two ushers",
  audience: ["Students", "Faculty"],
};

test("resolveMicrosoftCalendarEventsEndpoint uses the default calendar when no calendar id is configured", () => {
  assert.equal(
    resolveMicrosoftCalendarEventsEndpoint(baseConfig),
    "https://graph.microsoft.com/v1.0/users/calendar%40bhaprep.org/calendar/events",
  );
});

test("resolveMicrosoftCalendarEventsEndpoint targets a specific calendar when calendar id is configured", () => {
  assert.equal(
    resolveMicrosoftCalendarEventsEndpoint(
      {
        ...baseConfig,
        calendarId: "AAMkAGI2TAAA=",
      },
      "external-event-id",
    ),
    "https://graph.microsoft.com/v1.0/users/calendar%40bhaprep.org/calendars/AAMkAGI2TAAA%3D/events/external-event-id",
  );
});

test("buildMicrosoftGraphEventPayload maps a Maydan event into Graph event fields", () => {
  const payload = buildMicrosoftGraphEventPayload(baseEvent, {
    appUrl: "https://maydan.bhaprep.org/",
    timeZone: baseConfig.timeZone,
  });

  assert.equal(payload.subject, "English Department Assembly");
  assert.deepEqual(payload.start, {
    dateTime: "2026-03-05T09:15:00",
    timeZone: "Central Standard Time",
  });
  assert.deepEqual(payload.end, {
    dateTime: "2026-03-05T10:00:00",
    timeZone: "Central Standard Time",
  });
  assert.deepEqual(payload.location, {
    displayName: "Auditorium",
  });
  assert.equal(payload.transactionId, baseEvent.id);
  assert.match(payload.body.content, /This event was approved in Maydan/);
  assert.match(
    payload.body.content,
    /https:\/\/maydan\.bhaprep\.org\/events\/6ca3f1d2-7f21-4fd6-bf84-79fe1d7101af/,
  );
});

test("buildMicrosoftGraphEventPayload escapes unsafe HTML from event content", () => {
  const payload = buildMicrosoftGraphEventPayload(
    {
      ...baseEvent,
      description: "<script>alert('xss')</script>",
    },
    {
      appUrl: "https://maydan.bhaprep.org",
      timeZone: baseConfig.timeZone,
    },
  );

  assert.doesNotMatch(payload.body.content, /<script>/);
  assert.match(payload.body.content, /&lt;script&gt;alert/);
});
