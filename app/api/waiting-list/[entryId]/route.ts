import { env } from "cloudflare:workers";
import { currentAdmin, currentDelegate } from "../../auth/auth";

interface RouteContext { params: Promise<{ entryId: string }> }

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const { entryId } = await context.params;
    const admin = await currentAdmin(request);
    const delegate = admin ? null : await currentDelegate(request);
    if (!admin && !delegate) return Response.json({ code: "NOT_AUTHENTICATED", message: "Sign in before changing a waiting list." }, { status: 401 });
    const entry = await env.DB.prepare("SELECT id, delegate_id FROM waiting_list_entries WHERE id = ?").bind(entryId).first<{ id: string; delegate_id: string }>();
    if (!entry || (!admin && entry.delegate_id !== delegate!.id)) {
      return Response.json({ code: "WAITING_ENTRY_NOT_FOUND", message: "The waiting-list entry was not found." }, { status: 404 });
    }
    await env.DB.prepare("DELETE FROM waiting_list_entries WHERE id = ?").bind(entryId).run();
    return Response.json({ removed: true, entryId });
  } catch (error) {
    return Response.json({ code: "WAITING_LIST_REMOVE_FAILED", message: error instanceof Error ? error.message : "The waiting-list entry could not be removed." }, { status: 500 });
  }
}
