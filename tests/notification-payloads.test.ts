import test from "node:test";
import assert from "node:assert/strict";
import {
  getAlternativeNotifications,
  getEventSubmittedNotifications,
  getFinalApprovalNotifications,
  getIntermediateApprovalNotifications,
  getMarketingRequestNotifications,
  getRejectionNotifications,
  getResubmissionNotifications,
} from "../lib/notification-payloads";

test("submission notifications target first approver and Facilities Director", () => {
  const payloads = getEventSubmittedNotifications({
    eventId: "event-1",
    eventName: "STEM Night",
    firstApproverId: "approver-1",
    facilitiesDirectorId: "facilities-1",
  });

  assert.deepEqual(payloads, [
    {
      userId: "approver-1",
      eventId: "event-1",
      message: 'Action required: review "STEM Night".',
    },
    {
      userId: "facilities-1",
      eventId: "event-1",
      message: 'Facilities Director copied on "STEM Night".',
    },
  ]);
});

test("intermediate approval notifies the next approver", () => {
  const payloads = getIntermediateApprovalNotifications({
    eventId: "event-2",
    eventName: "House Challenge",
    nextApproverId: "approver-2",
  });

  assert.deepEqual(payloads, [
    {
      userId: "approver-2",
      eventId: "event-2",
      message: 'Action required: review "House Challenge".',
    },
  ]);
});

test("final approval, rejection, and alternative all notify the submitter", () => {
  assert.deepEqual(
    getFinalApprovalNotifications({
      eventId: "event-3",
      eventName: "Poetry Showcase",
      submitterId: "submitter-1",
    }),
    [
      {
        userId: "submitter-1",
        eventId: "event-3",
        message: '"Poetry Showcase" has been fully approved.',
      },
    ],
  );

  assert.deepEqual(
    getRejectionNotifications({
      eventId: "event-3",
      eventName: "Poetry Showcase",
      submitterId: "submitter-1",
      reason: "Need a clearer supervision plan.",
    }),
    [
      {
        userId: "submitter-1",
        eventId: "event-3",
        message:
          'Revision requested for "Poetry Showcase": Need a clearer supervision plan.',
      },
    ],
  );

  assert.deepEqual(
    getAlternativeNotifications({
      eventId: "event-3",
      eventName: "Poetry Showcase",
      submitterId: "submitter-1",
      suggestedDate: "2026-04-15",
      suggestedTime: "14:30",
    }),
    [
      {
        userId: "submitter-1",
        eventId: "event-3",
        message:
          'Alternative suggested for "Poetry Showcase": 2026-04-15 at 14:30.',
      },
    ],
  );
});

test("resubmission restarts the chain and optionally re-copies Facilities", () => {
  const withFacilities = getResubmissionNotifications({
    eventId: "event-4",
    eventName: "Quran Competition",
    firstApproverId: "approver-3",
    facilitiesDirectorId: "facilities-2",
  });
  const withoutFacilities = getResubmissionNotifications({
    eventId: "event-4",
    eventName: "Quran Competition",
    firstApproverId: "approver-3",
  });

  assert.deepEqual(withFacilities, [
    {
      userId: "approver-3",
      eventId: "event-4",
      message: 'Action required: review "Quran Competition".',
    },
    {
      userId: "facilities-2",
      eventId: "event-4",
      message:
        'Facilities Director copied on resubmitted event "Quran Competition".',
    },
  ]);
  assert.deepEqual(withoutFacilities, [
    {
      userId: "approver-3",
      eventId: "event-4",
      message: 'Action required: review "Quran Competition".',
    },
  ]);
});

test("marketing request notifies every PR recipient", () => {
  const payloads = getMarketingRequestNotifications({
    eventId: "event-5",
    eventName: "Service Day",
    prStaffIds: ["pr-1", "pr-2"],
  });

  assert.deepEqual(payloads, [
    {
      userId: "pr-1",
      eventId: "event-5",
      message: 'Marketing requested for "Service Day".',
    },
    {
      userId: "pr-2",
      eventId: "event-5",
      message: 'Marketing requested for "Service Day".',
    },
  ]);
});
