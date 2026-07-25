import { env } from "cloudflare:workers";
import { currentAdmin, currentDelegate } from "../../auth/auth";
import { sendWaitingListRemoved } from "../waitingListEmail";

interface RouteContext { params: Promise<{ entryId: string }> }

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const { entryId } = await context.params;
    const admin = await currentAdmin(request);
    const delegate = admin ? null : await currentDelegate(request);
    if (!admin && !delegate) return Response.json({ code: "NOT_AUTHENTICATED", message: "Sign in before changing a waiting list." }, { status: 401 });
    const entry = await env.DB.prepare(
      `SELECT w.id, w.delegate_id, trim(d.first_name || ' ' || d.last_name) AS delegate_name,
              d.email AS delegate_email, c.title AS course_title
       FROM waiting_list_entries w JOIN delegates d ON d.id = w.delegate_id JOIN courses c ON c.id = w.course_id
       WHERE w.id = ?`,
    ).bind(entryId).first<{ id: string; delegate_id: string; delegate_name: string; delegate_email: string; course_title: string }>();
    if (!entry || (!admin && entry.delegate_id !== delegate!.id)) {
      return Response.json({ code: "WAITING_ENTRY_NOT_FOUND", message: "The waiting-list entry was not found." }, { status: 404 });
    }
    await env.DB.prepare("DELETE FROM waiting_list_entries WHERE id = ?").bind(entryId).run();
    let emailSent = false;
    try {
      await sendWaitingListRemoved({ delegateName: entry.delegate_name, delegateEmail: entry.delegate_email, courseTitle: entry.course_title });
      emailSent = true;
    } catch (emailError) {
      console.error("Waiting-list removal succeeded but confirmation email failed.", { entryId, error: emailError });
    }
    return Response.json({ removed: true, entryId, emailSent });
  } catch (error) {
    return Response.json({ code: "WAITING_LIST_REMOVE_FAILED", message: error instanceof Error ? error.message : "The waiting-list entry could not be removed." }, { status: 500 });
  }
}
