import { env } from "cloudflare:workers";
import { currentDelegate } from "../auth/auth";

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
    const delegateId = delegate.id;

    const session = await env.DB.prepare(
      `SELECT s.id, s.course_id, s.location_id, s.status, s.available_seats,
              c.funding_type, c.price_pence
       FROM sessions s JOIN courses c ON c.id = s.course_id
       WHERE s.id = ?`,
    ).bind(payload.sessionId).first<{ id: string; course_id: string; location_id: string; status: string; available_seats: number; funding_type: string; price_pence: number | null }>();
    if (!session || session.course_id !== payload.courseId) return Response.json({ code: "SESSION_NOT_FOUND", message: "The selected session was not found for this course." }, { status: 404 });
    if (session.status !== "scheduled") return Response.json({ code: "SESSION_UNAVAILABLE", message: "Only scheduled sessions can accept bookings." }, { status: 409 });
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
        FROM sessions WHERE id = ? AND status = 'scheduled' AND available_seats > 0`,
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
    return Response.json({ booking }, { status: 201 });
  } catch (error) {
    return Response.json({ code: "BOOKING_CREATE_FAILED", message: error instanceof Error ? error.message : "The booking could not be created." }, { status: 500 });
  }
}
