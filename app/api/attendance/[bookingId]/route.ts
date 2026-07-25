import { env } from "cloudflare:workers";
import { currentAdmin } from "../../auth/auth";

interface RouteContext { params: Promise<{ bookingId: string }> }

export async function PUT(request: Request, context: RouteContext) {
  try {
    const admin = await currentAdmin(request);
    if (!admin) return Response.json({ code: "ADMIN_REQUIRED", message: "Administrator login required." }, { status: 401 });
    const { bookingId } = await context.params;
    const payload = await request.json() as { outcome?: "pending" | "attended" | "absent"; notes?: string };
    if (!payload.outcome || !["pending", "attended", "absent"].includes(payload.outcome)) {
      return Response.json({ code: "INVALID_ATTENDANCE", message: "Choose attended, absent or pending." }, { status: 400 });
    }
    const booking = await env.DB.prepare(
      `SELECT b.id, b.delegate_id, b.course_id, b.certificate_id, s.status AS session_status
       FROM bookings b JOIN sessions s ON s.id = b.session_id WHERE b.id = ?`,
    ).bind(bookingId).first<{ id: string; delegate_id: string; course_id: string; certificate_id: string | null; session_status: string }>();
    if (!booking) return Response.json({ code: "BOOKING_NOT_FOUND", message: "The booking was not found." }, { status: 404 });
    if (payload.outcome !== "pending" && booking.session_status !== "completed") {
      return Response.json({ code: "SESSION_NOT_COMPLETED", message: "Mark the session completed before recording attended or absent." }, { status: 409 });
    }
    const now = new Date().toISOString();
    const marked = payload.outcome !== "pending";
    const statements = [
      env.DB.prepare(
        `INSERT INTO attendance_records (booking_id, outcome, notes, marked_by_user_id, marked_at, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(booking_id) DO UPDATE SET outcome = excluded.outcome, notes = excluded.notes,
         marked_by_user_id = excluded.marked_by_user_id, marked_at = excluded.marked_at, updated_at = excluded.updated_at`,
      ).bind(bookingId, payload.outcome, payload.notes?.trim() || "", admin.id, marked ? now : null, now, now),
      env.DB.prepare("UPDATE bookings SET attendance_marked = ?, updated_at = ? WHERE id = ?").bind(payload.outcome === "attended" ? 1 : 0, now, bookingId),
    ];
    if (payload.outcome === "attended" && !booking.certificate_id) {
      const certificateId = `cert-${crypto.randomUUID()}`;
      statements.push(
        env.DB.prepare(
          `INSERT INTO certificates (id, booking_id, delegate_id, course_id, status, created_at, updated_at)
           VALUES (?, ?, ?, ?, 'pending', ?, ?)`,
        ).bind(certificateId, bookingId, booking.delegate_id, booking.course_id, now, now),
        env.DB.prepare("UPDATE bookings SET certificate_id = ? WHERE id = ?").bind(certificateId, bookingId),
      );
    } else if (booking.certificate_id && payload.outcome !== "attended") {
      statements.push(
        env.DB.prepare(
          "UPDATE certificates SET status = ?, updated_at = ? WHERE id = ?",
        ).bind("revoked", now, booking.certificate_id),
      );
    }
    await env.DB.batch(statements);
    const record = await env.DB.prepare("SELECT * FROM attendance_records WHERE booking_id = ?").bind(bookingId).first();
    return Response.json({ attendance: record });
  } catch (error) {
    return Response.json({ code: "ATTENDANCE_UPDATE_FAILED", message: error instanceof Error ? error.message : "Attendance could not be updated." }, { status: 500 });
  }
}
