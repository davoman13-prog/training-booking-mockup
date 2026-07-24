import { env } from "cloudflare:workers";
import { requireAdmin } from "../../auth/auth";

interface RouteContext { params: Promise<{ certificateId: string }> }

export async function PUT(request: Request, context: RouteContext) {
  const denied = await requireAdmin(request); if (denied) return denied;
  try {
    const { certificateId } = await context.params;
    const payload = await request.json() as { status?: "pending" | "available" | "issued" | "revoked" };
    if (!payload.status || !["pending", "available", "issued", "revoked"].includes(payload.status)) {
      return Response.json({ code: "INVALID_CERTIFICATE", message: "Choose a valid certificate status." }, { status: 400 });
    }
    const now = new Date().toISOString();
    const issuedDate = ["available", "issued"].includes(payload.status) ? now.slice(0, 10) : null;
    const result = await env.DB.prepare(
      "UPDATE certificates SET status = ?, issued_date = COALESCE(issued_date, ?), updated_at = ? WHERE id = ?",
    ).bind(payload.status, issuedDate, now, certificateId).run();
    if (!result.meta.changes) return Response.json({ code: "CERTIFICATE_NOT_FOUND", message: "The certificate was not found." }, { status: 404 });
    return Response.json({ certificate: await env.DB.prepare("SELECT * FROM certificates WHERE id = ?").bind(certificateId).first() });
  } catch (error) {
    return Response.json({ code: "CERTIFICATE_UPDATE_FAILED", message: error instanceof Error ? error.message : "The certificate could not be updated." }, { status: 500 });
  }
}
