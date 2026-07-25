import { sendTransactionalEmail } from "../auth/email";

export interface BookingEmailDetails {
  bookingId: string;
  delegateName: string;
  delegateEmail: string;
  courseTitle: string;
  courseDescription: string;
  joiningInstructions: string;
  fundingType: "funded" | "unfunded";
  pricePence: number | null;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  locationName: string;
  roomName: string;
  address: string;
  city: string;
  postcode: string;
  locationNotes: string;
  specialRequirements: string;
}

function escapeHtml(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

function displayDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Europe/London" })
    .format(new Date(`${value}T12:00:00Z`));
}

function priceText(details: BookingEmailDetails) {
  if (details.fundingType === "funded") return "Funded – no payment required";
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format((details.pricePence ?? 0) / 100);
}

function dateText(details: BookingEmailDetails) {
  return details.endDate && details.endDate !== details.startDate
    ? `${displayDate(details.startDate)} to ${displayDate(details.endDate)}`
    : displayDate(details.startDate);
}

export function bookingConfirmationContent(details: BookingEmailDetails) {
  const addressLines = [details.roomName, details.locationName, details.address, details.city, details.postcode].filter(Boolean);
  const plainSections = [
    `Hello ${details.delegateName},`,
    `Your place on ${details.courseTitle} is confirmed.`,
    `Booking reference: ${details.bookingId}`,
    `Date: ${dateText(details)}`,
    `Time: ${details.startTime}–${details.endTime}`,
    `Location:\n${addressLines.join("\n")}`,
    `Funding / price: ${priceText(details)}`,
    details.courseDescription ? `About the course:\n${details.courseDescription}` : "",
    details.joiningInstructions ? `Joining instructions:\n${details.joiningInstructions}` : "",
    details.locationNotes ? `Venue information:\n${details.locationNotes}` : "",
    details.specialRequirements ? `Your recorded requirements:\n${details.specialRequirements}` : "",
    "Please retain this email and bring any items identified in the joining instructions. Contact Kalu Training if any details need to be changed.",
  ].filter(Boolean);
  const row = (label: string, value: string) => `<tr><td style="padding:8px 12px;font-weight:700;vertical-align:top">${escapeHtml(label)}</td><td style="padding:8px 12px">${escapeHtml(value).replaceAll("\n", "<br>")}</td></tr>`;
  const htmlSections = [
    details.courseDescription ? `<h2 style="font-size:18px">About the course</h2><p>${escapeHtml(details.courseDescription).replaceAll("\n", "<br>")}</p>` : "",
    details.joiningInstructions ? `<h2 style="font-size:18px">Joining instructions</h2><p>${escapeHtml(details.joiningInstructions).replaceAll("\n", "<br>")}</p>` : "",
    details.locationNotes ? `<h2 style="font-size:18px">Venue information</h2><p>${escapeHtml(details.locationNotes).replaceAll("\n", "<br>")}</p>` : "",
    details.specialRequirements ? `<h2 style="font-size:18px">Your recorded requirements</h2><p>${escapeHtml(details.specialRequirements).replaceAll("\n", "<br>")}</p>` : "",
  ].filter(Boolean).join("");
  return {
    subject: `Booking confirmed: ${details.courseTitle}`,
    text: plainSections.join("\n\n"),
    html: `<div style="font-family:Arial,sans-serif;max-width:680px;margin:auto;color:#0f172a"><div style="background:#0891b2;color:white;padding:24px;border-radius:12px 12px 0 0"><h1 style="margin:0;font-size:24px">Your training booking is confirmed</h1></div><div style="border:1px solid #cbd5e1;padding:24px;border-radius:0 0 12px 12px"><p>Hello ${escapeHtml(details.delegateName)},</p><p>Your place on <strong>${escapeHtml(details.courseTitle)}</strong> is confirmed.</p><table style="width:100%;border-collapse:collapse;background:#f8fafc">${row("Booking reference", details.bookingId)}${row("Date", dateText(details))}${row("Time", `${details.startTime}–${details.endTime}`)}${row("Location", addressLines.join("\n"))}${row("Funding / price", priceText(details))}</table>${htmlSections}<p style="margin-top:24px">Please retain this email and bring any items identified in the joining instructions. Contact Kalu Training if any details need to be changed.</p></div></div>`,
  };
}

export async function sendBookingConfirmation(details: BookingEmailDetails) {
  const content = bookingConfirmationContent(details);
  await sendTransactionalEmail(details.delegateEmail, content.subject, content.text, content.html);
}

export function bookingCancellationContent(details: BookingEmailDetails) {
  const date = dateText(details);
  const time = `${details.startTime}–${details.endTime}`;
  return {
    subject: `Booking cancelled: ${details.courseTitle}`,
    text: [
      `Hello ${details.delegateName},`,
      `Your booking for ${details.courseTitle} has been cancelled.`,
      `Booking reference: ${details.bookingId}`,
      `Date: ${date}`,
      `Time: ${time}`,
      "Your place has been released. You do not need to take any further action.",
    ].join("\n\n"),
    html: `<div style="font-family:Arial,sans-serif;max-width:680px;margin:auto;color:#0f172a"><div style="background:#475569;color:white;padding:24px;border-radius:12px 12px 0 0"><h1 style="margin:0;font-size:24px">Your booking has been cancelled</h1></div><div style="border:1px solid #cbd5e1;padding:24px;border-radius:0 0 12px 12px"><p>Hello ${escapeHtml(details.delegateName)},</p><p>Your booking for <strong>${escapeHtml(details.courseTitle)}</strong> has been cancelled.</p><table style="width:100%;border-collapse:collapse;background:#f8fafc"><tr><td style="padding:8px 12px;font-weight:700">Booking reference</td><td style="padding:8px 12px">${escapeHtml(details.bookingId)}</td></tr><tr><td style="padding:8px 12px;font-weight:700">Date</td><td style="padding:8px 12px">${escapeHtml(date)}</td></tr><tr><td style="padding:8px 12px;font-weight:700">Time</td><td style="padding:8px 12px">${escapeHtml(time)}</td></tr></table><p style="margin-top:24px">Your place has been released. You do not need to take any further action.</p></div></div>`,
  };
}

export async function sendBookingCancellation(details: BookingEmailDetails) {
  const content = bookingCancellationContent(details);
  await sendTransactionalEmail(details.delegateEmail, content.subject, content.text, content.html);
}
