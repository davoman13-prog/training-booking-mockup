import { sendTransactionalEmail } from "../auth/email";

interface WaitingListEmailDetails {
  delegateName: string;
  delegateEmail: string;
  courseTitle: string;
}

function escapeHtml(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

export async function sendWaitingListAdded(details: WaitingListEmailDetails) {
  const subject = `Waiting list confirmed: ${details.courseTitle}`;
  const text = `Hello ${details.delegateName},\n\nYou have been added to the waiting list for ${details.courseTitle}.\n\nThe Kalu Training team can contact you when a suitable session becomes available. You can view or leave this waiting list from your Kalu Training account.`;
  const html = `<div style="font-family:Arial,sans-serif;max-width:680px;margin:auto;color:#0f172a"><div style="background:#0891b2;color:white;padding:24px;border-radius:12px 12px 0 0"><h1 style="margin:0;font-size:24px">Waiting list confirmed</h1></div><div style="border:1px solid #cbd5e1;padding:24px;border-radius:0 0 12px 12px"><p>Hello ${escapeHtml(details.delegateName)},</p><p>You have been added to the waiting list for <strong>${escapeHtml(details.courseTitle)}</strong>.</p><p>The Kalu Training team can contact you when a suitable session becomes available. You can view or leave this waiting list from your Kalu Training account.</p></div></div>`;
  await sendTransactionalEmail(details.delegateEmail, subject, text, html);
}

export async function sendWaitingListRemoved(details: WaitingListEmailDetails, booked = false) {
  const subject = `Waiting list removed: ${details.courseTitle}`;
  const explanation = booked
    ? "You have been removed from this waiting list because a course booking has been created for you. Your separate booking confirmation contains the session details."
    : "You have been removed from this waiting list. You will no longer be contacted about new sessions through this waiting-list entry.";
  const text = `Hello ${details.delegateName},\n\nYou have been removed from the waiting list for ${details.courseTitle}.\n\n${explanation}`;
  const html = `<div style="font-family:Arial,sans-serif;max-width:680px;margin:auto;color:#0f172a"><div style="background:#475569;color:white;padding:24px;border-radius:12px 12px 0 0"><h1 style="margin:0;font-size:24px">Waiting list updated</h1></div><div style="border:1px solid #cbd5e1;padding:24px;border-radius:0 0 12px 12px"><p>Hello ${escapeHtml(details.delegateName)},</p><p>You have been removed from the waiting list for <strong>${escapeHtml(details.courseTitle)}</strong>.</p><p>${escapeHtml(explanation)}</p></div></div>`;
  await sendTransactionalEmail(details.delegateEmail, subject, text, html);
}
