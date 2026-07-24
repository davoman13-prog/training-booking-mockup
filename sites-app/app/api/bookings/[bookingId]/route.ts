import { env } from "cloudflare:workers";
import { requireAdmin } from "../../auth/auth";

interface RouteContext { params: Promise<{ bookingId: string }> }

export async function PUT(request: Request, context: RouteContext) {
  const denied = await requireAdmin(request); if (denied) return denied;
  try {
    const { bookingId } = await context.params;
    const payload = await request.json() as { status?: "confirmed" | "pending" | "cancelled" | "completed"; specialRequirements?: string };
    if (!payload.status || !["confirmed", "pending", "cancelled", "completed"].includes(payload.status)) {
      return Response.json({ code: "INVALID_BOOKING", message: "A valid booking status is required." }, { status: 400 });
    }
    const booking = await env.DB.prepare("SELECT id, session_id, status FROM bookings WHERE id = ?").bind(bookingId).first<{ id: string; session_id: string; status: string }>();
    if (!booking) return Response.json({ code: "BOOKING_NOT_FOUND", message: "The booking was not found." }, { status: 404 });
    const wasActive = booking.status !== "cancelled";
    const willBeActive = payload.status !== "cancelled";
    const now = new Date().toISOString();
    const statements = [
      env.DB.prepare("UPDATE bookings SET status = ?, special_requirements = ?, updated_at = ? WHERE id = ?")
        .bind(payload.status, payload.specialRequirements?.trim() || null, now, bookingId),
    ];
    if (wasActive && !willBeActive) statements.push(env.DB.prepare("UPDATE sessions SET attendee_count = MAX(0, attendee_count - 1), available_seats = available_seats + 1, updated_at = ? WHERE id = ?").bind(now, booking.session_id));
    if (!wasActive && willBeActive) {
      const session = await env.DB.prepare("SELECT status, available_seats FROM sessions WHERE id = ?").bind(booking.session_id).first<{ status: string; available_seats: number }>();
      if (!session || session.status !== "scheduled" || session.available_seats < 1) return Response.json({ code: "SESSION_UNAVAILABLE", message: "The booking cannot be restored because the session is unavailable or full." }, { status: 409 });
      statements.push(env.DB.prepare("UPDATE sessions SET attendee_count = attendee_count + 1, available_seats = available_seats - 1, updated_at = ? WHERE id = ? AND available_seats > 0").bind(now, booking.session_id));
    }
    await env.DB.batch(statements);
    const updated = await env.DB.prepare("SELECT * FROM bookings WHERE id = ?").bind(bookingId).first();
    return Response.json({ booking: updated });
  } catch (error) {
    return Response.json({ code: "BOOKING_UPDATE_FAILED", message: error instanceof Error ? error.message : "The booking could not be updated." }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const denied = await requireAdmin(request); if (denied) return denied;
  try {
    const { bookingId } = await context.params;
    const booking = await env.DB.prepare("SELECT id, session_id, status FROM bookings WHERE id = ?").bind(bookingId).first<{ id: string; session_id: string; status: string }>();
    if (!booking) return Response.json({ code: "BOOKING_NOT_FOUND", message: "The booking was not found." }, { status: 404 });
    const statements = [env.DB.prepare("DELETE FROM bookings WHERE id = ?").bind(bookingId)];
    if (booking.status !== "cancelled") statements.push(env.DB.prepare("UPDATE sessions SET attendee_count = MAX(0, attendee_count - 1), available_seats = available_seats + 1, updated_at = ? WHERE id = ?").bind(new Date().toISOString(), booking.session_id));
    await env.DB.batch(statements);
    return Response.json({ deleted: true, bookingId });
  } catch (error) {
    return Response.json({ code: "BOOKING_DELETE_FAILED", message: error instanceof Error ? error.message : "The booking could not be removed." }, { status: 500 });
  }
}
