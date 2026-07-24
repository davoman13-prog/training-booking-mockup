import { env } from "cloudflare:workers";
import { currentDelegate } from "../../../auth/auth";

interface RouteContext { params: Promise<{ bookingId: string }> }

export async function POST(request: Request, context: RouteContext) {
  try {
    const delegate = await currentDelegate(request);
    if (!delegate) return Response.json({ code: "NOT_AUTHENTICATED", message: "Sign in before cancelling a booking." }, { status: 401 });
    const { bookingId } = await context.params;
    const booking = await env.DB.prepare(
      "SELECT id, delegate_id, session_id, status FROM bookings WHERE id = ?",
    ).bind(bookingId).first<{ id: string; delegate_id: string; session_id: string; status: string }>();
    if (!booking || booking.delegate_id !== delegate.id) {
      return Response.json({ code: "BOOKING_NOT_FOUND", message: "The booking was not found." }, { status: 404 });
    }
    if (booking.status === "cancelled") return Response.json({ booking });
    if (booking.status === "completed") {
      return Response.json({ code: "BOOKING_COMPLETED", message: "A completed booking cannot be cancelled." }, { status: 409 });
    }
    const now = new Date().toISOString();
    await env.DB.batch([
      env.DB.prepare("UPDATE bookings SET status = 'cancelled', updated_at = ? WHERE id = ? AND status != 'cancelled'").bind(now, bookingId),
      env.DB.prepare("UPDATE sessions SET attendee_count = MAX(0, attendee_count - 1), available_seats = available_seats + 1, updated_at = ? WHERE id = ?").bind(now, booking.session_id),
    ]);
    const updated = await env.DB.prepare("SELECT * FROM bookings WHERE id = ?").bind(bookingId).first();
    return Response.json({ booking: updated });
  } catch (error) {
    return Response.json({ code: "BOOKING_CANCEL_FAILED", message: error instanceof Error ? error.message : "The booking could not be cancelled." }, { status: 500 });
  }
}
