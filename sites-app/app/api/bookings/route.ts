import { env } from "cloudflare:workers";
import { currentDelegate } from "../auth/auth";
import { BookingEmailDetails, sendBookingConfirmation } from "./bookingConfirmationEmail";

interface BookingPayload {
  courseId?: string;
  sessionId?: string;
  specialRequirements?: string;
  termsAccepted?: boolean;
}

export async function POST(request: Request) {
  try {
    const payload = await request.json() as BookingPayload;
    if (!payload.courseId || !payload.sessionId) {
      return Response.json({ code: "INVALID_BOOKING", message: "Course and session are required." }, { status: 400 });
    }
    if (!payload.termsAccepted) return Response.json({ code: "TERMS_REQUIRED", message: "The booking terms must be accepted." }, { status: 400 });
    const delegate = await currentDelegate(request);
    if (!delegate) return Response.json({ code: "NOT_AUTHENTICATED", message: "Log in before creating a booking." }, { status: 401 });
    if (!delegate.canBook) return Response.json({ code: "BOOKING_BLOCKED", message: "Your account is not currently permitted to make course bookings." }, { status: 403 });
    const delegateId = delegate.id;

    const session = await env.DB.prepare(
      `SELECT s.id, s.course_id, s.location_id, s.status, s.start_date, s.available_seats,
              c.status AS course_status, c.funding_type, c.price_pence
       FROM sessions s JOIN courses c ON c.id = s.course_id
       WHERE s.id = ?`,
    ).bind(payload.sessionId).first<{ id: string; course_id: string; location_id: string; status: string; start_date: string; available_seats: number; course_status: string; funding_type: string; price_pence: number | null }>();
    if (!session || session.course_id !== payload.courseId) return Response.json({ code: "SESSION_NOT_FOUND", message: "The selected session was not found for this course." }, { status: 404 });
    if (session.course_status === "cancelled" || session.course_status === "completed") {
      return Response.json({ code: "COURSE_UNAVAILABLE", message: "This course is cancelled or completed and cannot accept bookings." }, { status: 409 });
    }
    if (session.status !== "scheduled") return Response.json({ code: "SESSION_UNAVAILABLE", message: "Only scheduled sessions can accept bookings." }, { status: 409 });
    if (session.start_date < new Date().toISOString().slice(0, 10)) {
      return Response.json({ code: "SESSION_PASSED", message: "This session date has passed and cannot accept bookings." }, { status: 409 });
    }
    if (session.available_seats < 1) return Response.json({ code: "SESSION_FULL", message: "This session is full." }, { status: 409 });

    const duplicate = await env.DB.prepare(
      "SELECT id FROM bookings WHERE delegate_id = ? AND session_id = ? AND status <> 'cancelled'",
    ).bind(delegateId, payload.sessionId).first();
    if (duplicate) return Response.json({ code: "DUPLICATE_BOOKING", message: "This delegate already has an active booking for the session." }, { status: 409 });

    const id = `booking-${crypto.randomUUID()}`;
    const now = new Date().toISOString();
    const statements = [
      env.DB.prepare(
        `INSERT INTO bookings
        (id, delegate_id, course_id, session_id, location_id, booking_date, status, payment_required, terms_accepted, special_requirements, attendance_marked, created_at, updated_at)
        SELECT ?, ?, ?, ?, ?, ?, 'confirmed', ?, 1, ?, 0, ?, ?
        FROM sessions
        WHERE id = ? AND status = 'scheduled' AND start_date >= date('now') AND available_seats > 0
          AND EXISTS (
            SELECT 1 FROM courses
            WHERE courses.id = sessions.course_id
              AND courses.status NOT IN ('cancelled', 'completed')
          )`,
      ).bind(id, delegateId, payload.courseId, payload.sessionId, session.location_id, now.slice(0, 10), session.funding_type === "unfunded" ? 1 : 0, payload.specialRequirements?.trim() || null, now, now, payload.sessionId),
      env.DB.prepare("UPDATE sessions SET attendee_count = attendee_count + 1, available_seats = available_seats - 1, updated_at = ? WHERE id = ? AND available_seats > 0 AND EXISTS (SELECT 1 FROM bookings WHERE id = ?)").bind(now, payload.sessionId, id),
      env.DB.prepare(
        `INSERT INTO attendance_records (booking_id, outcome, notes, created_at, updated_at)
         SELECT ?, 'pending', '', ?, ? WHERE EXISTS (SELECT 1 FROM bookings WHERE id = ?)`,
      ).bind(id, now, now, id),
    ];
    if (session.funding_type === "unfunded") {
      const invoiceId = `invoice-${crypto.randomUUID()}`;
      const dueDate = new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10);
      statements.push(
        env.DB.prepare(
          `INSERT INTO invoices (id, booking_id, delegate_id, course_id, amount_pence, due_date, status, created_at, updated_at)
           SELECT ?, ?, ?, ?, ?, ?, 'draft', ?, ? WHERE EXISTS (SELECT 1 FROM bookings WHERE id = ?)`,
        ).bind(invoiceId, id, delegateId, payload.courseId, session.price_pence ?? 0, dueDate, now, now, id),
        env.DB.prepare("UPDATE bookings SET invoice_id = ? WHERE id = ?").bind(invoiceId, id),
      );
    }
    await env.DB.batch(statements);
    const booking = await env.DB.prepare("SELECT * FROM bookings WHERE id = ?").bind(id).first();
    if (!booking) return Response.json({ code: "SESSION_FULL", message: "The final available place was taken before this booking completed. Please choose another session." }, { status: 409 });
    let confirmationEmailSent = false;
    try {
      const details = await env.DB.prepare(
        `SELECT b.id AS bookingId,
                trim(d.first_name || ' ' || d.last_name) AS delegateName, d.email AS delegateEmail,
                c.title AS courseTitle, c.description AS courseDescription, c.joining_instructions AS joiningInstructions,
                c.funding_type AS fundingType, c.price_pence AS pricePence,
                s.start_date AS startDate, s.end_date AS endDate, s.start_time AS startTime, s.end_time AS endTime,
                l.name AS locationName, l.room_name AS roomName, l.address, l.city, l.postcode,
                coalesce(l.notes, '') AS locationNotes, coalesce(b.special_requirements, '') AS specialRequirements
         FROM bookings b
         JOIN delegates d ON d.id = b.delegate_id
         JOIN courses c ON c.id = b.course_id
         JOIN sessions s ON s.id = b.session_id
         JOIN locations l ON l.id = b.location_id
         WHERE b.id = ?`,
      ).bind(id).first<BookingEmailDetails>();
      if (details) {
        await sendBookingConfirmation(details);
        confirmationEmailSent = true;
      }
    } catch (emailError) {
      console.error("Booking succeeded but confirmation email failed.", { bookingId: id, error: emailError });
    }
    return Response.json({ booking, confirmationEmailSent }, { status: 201 });
  } catch (error) {
    return Response.json({ code: "BOOKING_CREATE_FAILED", message: error instanceof Error ? error.message : "The booking could not be created." }, { status: 500 });
  }
}
