import { env } from "cloudflare:workers";
import { requireAdmin } from "../../auth/auth";

interface RouteContext { params: Promise<{ invoiceId: string }> }

export async function PUT(request: Request, context: RouteContext) {
  const denied = await requireAdmin(request); if (denied) return denied;
  try {
    const { invoiceId } = await context.params;
    const payload = await request.json() as { status?: "draft" | "issued" | "paid" | "overdue" | "cancelled" };
    if (!payload.status || !["draft", "issued", "paid", "overdue", "cancelled"].includes(payload.status)) {
      return Response.json({ code: "INVALID_INVOICE", message: "Choose a valid invoice status." }, { status: 400 });
    }
    const now = new Date().toISOString();
    const issuedDate = payload.status === "draft" ? null : now.slice(0, 10);
    const paidAt = payload.status === "paid" ? now : null;
    const result = await env.DB.prepare(
      `UPDATE invoices SET status = ?, issued_date = COALESCE(issued_date, ?), paid_at = ?, updated_at = ? WHERE id = ?`,
    ).bind(payload.status, issuedDate, paidAt, now, invoiceId).run();
    if (!result.meta.changes) return Response.json({ code: "INVOICE_NOT_FOUND", message: "The invoice was not found." }, { status: 404 });
    return Response.json({ invoice: await env.DB.prepare("SELECT * FROM invoices WHERE id = ?").bind(invoiceId).first() });
  } catch (error) {
    return Response.json({ code: "INVOICE_UPDATE_FAILED", message: error instanceof Error ? error.message : "The invoice could not be updated." }, { status: 500 });
  }
}
