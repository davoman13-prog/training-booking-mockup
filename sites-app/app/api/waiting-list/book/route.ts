import { env } from "cloudflare:workers";
import { requireAdmin } from "../../auth/auth";
import { BookingEmailDetails, sendBookingConfirmation } from "../../bookings/bookingConfirmationEmail";
import { sendWaitingListRemoved } from "../waitingListEmail";

export async function POST(request: Request) {
  const denied = await requireAdmin(request); if (denied) return denied;
  try {
    const payload = await request.json() as { sessionId?: string; delegateIds?: string[] };
    if (!payload.sessionId || !payload.delegateIds?.length) {
      return Response.json({ code: "SELECTION_REQUIRED", message: "Choose a session and at least one waiting delegate." }, { status: 400 });
    }
    const delegateIds = [...new Set(payload.delegateIds)];
    const session = await env.DB.prepare(
      `SELECT s.id, s.course_id, s.location_id, s.status, s.start_date, s.available_seats,
              c.status AS course_status, c.funding_type, c.price_pence
       FROM sessions s JOIN courses c ON c.id = s.course_id WHERE s.id = ?`,
    ).bind(payload.sessionId).first<{
      id: string; course_id: string; location_id: string; status: string; start_date: string;
      available_seats: number; course_status: string; funding_type: string; price_pence: number | null;
    }>();
    if (!session || session.status !== "scheduled" || session.start_date < new Date().toISOString().slice(0, 10) || ["cancelled", "completed"].includes(session.course_status)) {
      return Response.json({ code: "SESSION_UNAVAILABLE", message: "This session cannot accept waiting-list bookings." }, { status: 409 });
    }
    if (session.available_seats < 1) return Response.json({ code: "SESSION_FULL", message: "This session is full." }, { status: 409 });
    const placeholders = delegateIds.map(() => "?").join(",");
    const waiting = await env.DB.prepare(
      `SELECT w.id, w.delegate_id
       FROM waiting_list_entries w
       JOIN delegates d ON d.id = w.delegate_id
       JOIN courses c ON c.id = w.course_id
       WHERE w.course_id = ? AND w.delegate_id IN (${placeholders})
         AND d.account_status = 'active' AND d.can_book = 1
         AND EXISTS (SELECT 1 FROM json_each(c.audience_types) audience WHERE audience.value = d.staff_type)`,
    ).bind(session.course_id, ...delegateIds).all<{ id: string; delegate_id: string }>();
    const selected = waiting.results.slice(0, session.available_seats);
    if (!selected.length) return Response.json({ code: "NO_ELIGIBLE_DELEGATES", message: "No selected delegates remain on this waiting list." }, { status: 409 });
    const now = new Date().toISOString();
    const bookingIds: string[] = [];
    const statements = [];
    for (const entry of selected) {
      const duplicate = await env.DB.prepare(
        "SELECT id FROM bookings WHERE delegate_id = ? AND session_id = ? AND status <> 'cancelled'",
      ).bind(entry.delegate_id, session.id).first();
      if (duplicate) continue;
      const bookingId = `booking-${crypto.randomUUID()}`;
      bookingIds.push(bookingId);
      statements.push(
        env.DB.prepare(
          `INSERT INTO bookings
           (id, delegate_id, course_id, session_id, location_id, booking_date, status, payment_required, terms_accepted, special_requirements, attendance_marked, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, 'confirmed', ?, 1, NULL, 0, ?, ?)`,
        ).bind(bookingId, entry.delegate_id, session.course_id, session.id, session.location_id, now.slice(0, 10), session.funding_type === "unfunded" ? 1 : 0, now, now),
        env.DB.prepare("UPDATE sessions SET attendee_count = attendee_count + 1, available_seats = available_seats - 1, updated_at = ? WHERE id = ? AND available_seats > 0").bind(now, session.id),
        env.DB.prepare("INSERT INTO attendance_records (booking_id, outcome, notes, created_at, updated_at) VALUES (?, 'pending', '', ?, ?)").bind(bookingId, now, now),
        env.DB.prepare("DELETE FROM waiting_list_entries WHERE id = ?").bind(entry.id),
      );
      if (session.funding_type === "unfunded") {
        const invoiceId = `invoice-${crypto.randomUUID()}`;
        const dueDate = new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10);
        statements.push(
          env.DB.prepare("INSERT INTO invoices (id, booking_id, delegate_id, course_id, amount_pence, due_date, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 'draft', ?, ?)")
            .bind(invoiceId, bookingId, entry.delegate_id, session.course_id, session.price_pence ?? 0, dueDate, now, now),
          env.DB.prepare("UPDATE bookings SET invoice_id = ? WHERE id = ?").bind(invoiceId, bookingId),
        );
      }
    }
    if (!bookingIds.length) return Response.json({ code: "ALREADY_BOOKED", message: "The selected delegates are already booked." }, { status: 409 });
    await env.DB.batch(statements);
    let emailsSent = 0;
    for (const bookingId of bookingIds) {
      try {
        const details = await env.DB.prepare(
          `SELECT b.id AS bookingId, trim(d.first_name || ' ' || d.last_name) AS delegateName, d.email AS delegateEmail,
                  c.title AS courseTitle, c.description AS courseDescription, c.joining_instructions AS joiningInstructions,
                  c.funding_type AS fundingType, c.price_pence AS pricePence,
                  s.start_date AS startDate, s.end_date AS endDate, s.start_time AS startTime, s.end_time AS endTime,
                  l.name AS locationName, l.room_name AS roomName, l.address, l.city, l.postcode,
                  coalesce(l.notes, '') AS locationNotes, coalesce(b.special_requirements, '') AS specialRequirements
           FROM bookings b JOIN delegates d ON d.id = b.delegate_id JOIN courses c ON c.id = b.course_id
           JOIN sessions s ON s.id = b.session_id JOIN locations l ON l.id = b.location_id WHERE b.id = ?`,
        ).bind(bookingId).first<BookingEmailDetails>();
        if (details) {
          await sendBookingConfirmation(details);
          await sendWaitingListRemoved({ delegateName: details.delegateName, delegateEmail: details.delegateEmail, courseTitle: details.courseTitle }, true);
          emailsSent += 1;
        }
      } catch (emailError) {
        console.error("Waiting-list booking succeeded but confirmation email failed.", { bookingId, error: emailError });
      }
    }
    return Response.json({ booked: bookingIds.length, bookingIds, emailsSent });
  } catch (error) {
    return Response.json({ code: "WAITING_LIST_BOOK_FAILED", message: error instanceof Error ? error.message : "Waiting delegates could not be booked." }, { status: 500 });
  }
}
