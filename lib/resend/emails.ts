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
