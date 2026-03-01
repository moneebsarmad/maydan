import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const fromEmail = "maydan@bhaprep.org";

export async function sendApprovalRequestEmail(
  to: string,
  eventName: string,
  eventId: string,
) {
  return resend.emails.send({
    from: fromEmail,
    to,
    subject: `Action Required: Approve "${eventName}"`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #0f172a;">
        <h2 style="margin-bottom: 8px;">Approval requested</h2>
        <p>A new Maydan event needs your review.</p>
        <p><strong>Event:</strong> ${escapeHtml(eventName)}</p>
        <p>
          Open the event:
          <a href="${appUrl}/events/${eventId}">${appUrl}/events/${eventId}</a>
        </p>
      </div>
    `,
  });
}

export async function sendFacilitiesCcEmail(
  to: string,
  eventName: string,
  eventId: string,
) {
  return resend.emails.send({
    from: fromEmail,
    to,
    subject: `Facilities CC: "${eventName}"`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #0f172a;">
        <h2 style="margin-bottom: 8px;">Facilities copied on event</h2>
        <p>You were copied on a new Maydan event submission.</p>
        <p><strong>Event:</strong> ${escapeHtml(eventName)}</p>
        <p>
          Review the event:
          <a href="${appUrl}/events/${eventId}">${appUrl}/events/${eventId}</a>
        </p>
      </div>
    `,
  });
}

export async function sendFacilitiesNotificationEmail(
  to: string,
  eventName: string,
  eventId: string,
) {
  return sendFacilitiesCcEmail(to, eventName, eventId);
}

export async function sendEventApprovedEmail(to: string, eventName: string) {
  return resend.emails.send({
    from: fromEmail,
    to,
    subject: `Approved: "${eventName}"`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #0f172a;">
        <h2 style="margin-bottom: 8px;">Event approved</h2>
        <p>Your Maydan event completed the full approval chain.</p>
        <p><strong>Event:</strong> ${escapeHtml(eventName)}</p>
      </div>
    `,
  });
}

export async function sendEventRejectedEmail(
  to: string,
  eventName: string,
  reason: string,
) {
  return resend.emails.send({
    from: fromEmail,
    to,
    subject: `Revision requested for "${eventName}"`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #0f172a;">
        <h2 style="margin-bottom: 8px;">Revision requested</h2>
        <p>Your Maydan event needs changes before it can continue.</p>
        <p><strong>Event:</strong> ${escapeHtml(eventName)}</p>
        <p><strong>Reason:</strong> ${escapeHtml(reason)}</p>
      </div>
    `,
  });
}

export async function sendAlternativeSuggestedEmail(
  to: string,
  eventName: string,
  date: string,
  time: string,
) {
  return resend.emails.send({
    from: fromEmail,
    to,
    subject: `Alternative time suggested for "${eventName}"`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #0f172a;">
        <h2 style="margin-bottom: 8px;">Alternative suggested</h2>
        <p>An approver suggested a different schedule for your Maydan event.</p>
        <p><strong>Event:</strong> ${escapeHtml(eventName)}</p>
        <p><strong>Suggested date:</strong> ${escapeHtml(date)}</p>
        <p><strong>Suggested time:</strong> ${escapeHtml(time)}</p>
      </div>
    `,
  });
}

export async function sendMarketingRequestEmail(
  to: string,
  eventName: string,
  requestDetails: string,
  eventId: string,
) {
  return resend.emails.send({
    from: fromEmail,
    to,
    subject: `Marketing requested for "${eventName}"`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #0f172a;">
        <h2 style="margin-bottom: 8px;">Marketing request received</h2>
        <p>A Maydan event submitted a marketing request.</p>
        <p><strong>Event:</strong> ${escapeHtml(eventName)}</p>
        <p><strong>Request details:</strong> ${escapeHtml(requestDetails)}</p>
        <p>
          Review the event:
          <a href="${appUrl}/events/${eventId}">${appUrl}/events/${eventId}</a>
        </p>
      </div>
    `,
  });
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
