import { env } from "cloudflare:workers";
import { currentDelegate } from "../auth/auth";

export async function POST(request: Request) {
  try {
    const delegate = await currentDelegate(request);
    if (!delegate) return Response.json({ code: "NOT_AUTHENTICATED", message: "Sign in before joining a waiting list." }, { status: 401 });
    const payload = await request.json() as { courseId?: string };
    if (!payload.courseId) return Response.json({ code: "COURSE_REQUIRED", message: "Course is required." }, { status: 400 });
    const course = await env.DB.prepare("SELECT id, status FROM courses WHERE id = ?").bind(payload.courseId).first<{ id: string; status: string }>();
    if (!course) return Response.json({ code: "COURSE_NOT_FOUND", message: "The course was not found." }, { status: 404 });
    if (course.status === "cancelled" || course.status === "completed") {
      return Response.json({ code: "COURSE_UNAVAILABLE", message: "A waiting list is not available for a cancelled or completed course." }, { status: 409 });
    }
    const activeBooking = await env.DB.prepare(
      "SELECT id FROM bookings WHERE delegate_id = ? AND course_id = ? AND status NOT IN ('cancelled', 'completed')",
    ).bind(delegate.id, payload.courseId).first();
    if (activeBooking) return Response.json({ code: "ALREADY_BOOKED", message: "You already have an active booking for this course." }, { status: 409 });
    const existing = await env.DB.prepare(
      "SELECT * FROM waiting_list_entries WHERE delegate_id = ? AND course_id = ?",
    ).bind(delegate.id, payload.courseId).first();
    if (existing) return Response.json({ entry: existing, alreadyJoined: true });
    const id = `waiting-${crypto.randomUUID()}`;
    const now = new Date().toISOString();
    await env.DB.prepare(
      "INSERT INTO waiting_list_entries (id, delegate_id, course_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
    ).bind(id, delegate.id, payload.courseId, now, now).run();
    const entry = await env.DB.prepare("SELECT * FROM waiting_list_entries WHERE id = ?").bind(id).first();
    return Response.json({ entry, alreadyJoined: false }, { status: 201 });
  } catch (error) {
    return Response.json({ code: "WAITING_LIST_JOIN_FAILED", message: error instanceof Error ? error.message : "The waiting list could not be updated." }, { status: 500 });
  }
}
