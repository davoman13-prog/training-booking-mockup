import { env } from "cloudflare:workers";
import { currentAdmin, currentDelegate } from "../auth/auth";
import { sendWaitingListAdded } from "./waitingListEmail";

export async function POST(request: Request) {
  try {
    const admin = await currentAdmin(request);
    const signedInDelegate = admin ? null : await currentDelegate(request);
    if (!admin && !signedInDelegate) return Response.json({ code: "NOT_AUTHENTICATED", message: "Sign in before joining a waiting list." }, { status: 401 });
    const payload = await request.json() as { courseId?: string; delegateId?: string };
    if (!payload.courseId) return Response.json({ code: "COURSE_REQUIRED", message: "Course is required." }, { status: 400 });
    const delegateId = admin ? payload.delegateId : signedInDelegate!.id;
    if (!delegateId) return Response.json({ code: "DELEGATE_REQUIRED", message: "Choose a delegate." }, { status: 400 });
    if (signedInDelegate && !signedInDelegate.canBook) return Response.json({ code: "BOOKING_BLOCKED", message: "Your account is not currently permitted to join course waiting lists." }, { status: 403 });
    const targetDelegate = await env.DB.prepare(
      "SELECT id, trim(first_name || ' ' || last_name) AS name, email, account_status, can_book FROM delegates WHERE id = ?",
    ).bind(delegateId).first<{ id: string; name: string; email: string; account_status: string; can_book: number }>();
    if (!targetDelegate) return Response.json({ code: "DELEGATE_NOT_FOUND", message: "The delegate was not found." }, { status: 404 });
    if (targetDelegate.account_status !== "active" || !targetDelegate.can_book) return Response.json({ code: "BOOKING_BLOCKED", message: "This delegate is not currently permitted to join waiting lists." }, { status: 409 });
    const course = await env.DB.prepare("SELECT id, title, status FROM courses WHERE id = ?").bind(payload.courseId).first<{ id: string; title: string; status: string }>();
    if (!course) return Response.json({ code: "COURSE_NOT_FOUND", message: "The course was not found." }, { status: 404 });
    if (course.status === "cancelled" || course.status === "completed") {
      return Response.json({ code: "COURSE_UNAVAILABLE", message: "A waiting list is not available for a cancelled or completed course." }, { status: 409 });
    }
    const activeBooking = await env.DB.prepare(
      "SELECT id FROM bookings WHERE delegate_id = ? AND course_id = ? AND status NOT IN ('cancelled', 'completed')",
    ).bind(delegateId, payload.courseId).first();
    if (activeBooking) return Response.json({ code: "ALREADY_BOOKED", message: "You already have an active booking for this course." }, { status: 409 });
    const existing = await env.DB.prepare(
      "SELECT * FROM waiting_list_entries WHERE delegate_id = ? AND course_id = ?",
    ).bind(delegateId, payload.courseId).first();
    if (existing) return Response.json({ entry: existing, alreadyJoined: true });
    const id = `waiting-${crypto.randomUUID()}`;
    const now = new Date().toISOString();
    await env.DB.prepare(
      "INSERT INTO waiting_list_entries (id, delegate_id, course_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
    ).bind(id, delegateId, payload.courseId, now, now).run();
    const entry = await env.DB.prepare("SELECT * FROM waiting_list_entries WHERE id = ?").bind(id).first();
    let emailSent = false;
    try {
      await sendWaitingListAdded({ delegateName: targetDelegate.name, delegateEmail: targetDelegate.email, courseTitle: course.title });
      emailSent = true;
    } catch (emailError) {
      console.error("Waiting-list entry succeeded but confirmation email failed.", { entryId: id, error: emailError });
    }
    return Response.json({ entry, alreadyJoined: false, emailSent }, { status: 201 });
  } catch (error) {
    return Response.json({ code: "WAITING_LIST_JOIN_FAILED", message: error instanceof Error ? error.message : "The waiting list could not be updated." }, { status: 500 });
  }
}
