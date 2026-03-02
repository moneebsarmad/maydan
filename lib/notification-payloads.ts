export interface NotificationPayload {
  userId: string;
  eventId: string;
  message: string;
}

export function getEventSubmittedNotifications(input: {
  eventId: string;
  eventName: string;
  firstApproverId: string;
  facilitiesDirectorId: string;
}): NotificationPayload[] {
  return [
    {
      userId: input.firstApproverId,
      eventId: input.eventId,
      message: `Action required: review "${input.eventName}".`,
    },
    {
      userId: input.facilitiesDirectorId,
      eventId: input.eventId,
      message: `Facilities Director copied on "${input.eventName}".`,
    },
  ];
}

export function getMarketingRequestNotifications(input: {
  eventId: string;
  eventName: string;
  prStaffIds: string[];
}): NotificationPayload[] {
  return input.prStaffIds.map((userId) => ({
    userId,
    eventId: input.eventId,
    message: `Marketing requested for "${input.eventName}".`,
  }));
}

export function getMarketingCommentNotifications(input: {
  eventId: string;
  eventName: string;
  submitterId: string;
  commenterName: string;
}): NotificationPayload[] {
  return [
    {
      userId: input.submitterId,
      eventId: input.eventId,
      message: `${input.commenterName} added a marketing note to "${input.eventName}".`,
    },
  ];
}

export function getIntermediateApprovalNotifications(input: {
  eventId: string;
  eventName: string;
  nextApproverId: string;
}): NotificationPayload[] {
  return [
    {
      userId: input.nextApproverId,
      eventId: input.eventId,
      message: `Action required: review "${input.eventName}".`,
    },
  ];
}

export function getFinalApprovalNotifications(input: {
  eventId: string;
  eventName: string;
  submitterId: string;
}): NotificationPayload[] {
  return [
    {
      userId: input.submitterId,
      eventId: input.eventId,
      message: `"${input.eventName}" has been fully approved.`,
    },
  ];
}

export function getRejectionNotifications(input: {
  eventId: string;
  eventName: string;
  submitterId: string;
  reason: string;
}): NotificationPayload[] {
  return [
    {
      userId: input.submitterId,
      eventId: input.eventId,
      message: `Revision requested for "${input.eventName}": ${input.reason}`,
    },
  ];
}

export function getAlternativeNotifications(input: {
  eventId: string;
  eventName: string;
  submitterId: string;
  suggestedDate: string;
  suggestedTime: string;
}): NotificationPayload[] {
  return [
    {
      userId: input.submitterId,
      eventId: input.eventId,
      message: `Alternative suggested for "${input.eventName}": ${input.suggestedDate} at ${input.suggestedTime}.`,
    },
  ];
}

export function getResubmissionNotifications(input: {
  eventId: string;
  eventName: string;
  firstApproverId: string;
  facilitiesDirectorId?: string | null;
}): NotificationPayload[] {
  return [
    {
      userId: input.firstApproverId,
      eventId: input.eventId,
      message: `Action required: review "${input.eventName}".`,
    },
    ...(input.facilitiesDirectorId
      ? [
          {
            userId: input.facilitiesDirectorId,
            eventId: input.eventId,
            message: `Facilities Director copied on resubmitted event "${input.eventName}".`,
          },
        ]
      : []),
  ];
}
