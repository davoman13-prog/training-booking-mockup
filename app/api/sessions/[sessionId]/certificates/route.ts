import { env } from "cloudflare:workers";
import { requireAdmin } from "../../../auth/auth";
import { issueCertificate } from "../../../certificates/issueCertificate";

interface RouteContext { params: Promise<{ sessionId: string }> }

export async function POST(request: Request, context: RouteContext) {
  const denied = await requireAdmin(request); if (denied) return denied;
  try {
    const { sessionId } = await context.params;
    const session = await env.DB.prepare("SELECT status FROM sessions WHERE id = ?").bind(sessionId).first<{ status: string }>();
    if (!session) return Response.json({ code: "SESSION_NOT_FOUND", message: "The session was not found." }, { status: 404 });
    if (session.status !== "completed") return Response.json({ code: "SESSION_NOT_COMPLETED", message: "Mark the session completed before issuing certificates." }, { status: 409 });
    const records = await env.DB.prepare(
      `SELECT cert.id
       FROM certificates cert
       JOIN bookings b ON b.id = cert.booking_id
       JOIN attendance_records a ON a.booking_id = b.id
       WHERE b.session_id = ? AND a.outcome = 'attended' AND cert.status <> 'revoked'`,
    ).bind(sessionId).all<{ id: string }>();
    if (!records.results.length) return Response.json({ code: "NO_ATTENDED_DELEGATES", message: "No attended delegates have certificates ready to issue." }, { status: 409 });
    let issued = 0;
    let emailsSent = 0;
    const failures: string[] = [];
    for (const record of records.results) {
      try {
        const result = await issueCertificate(record.id);
        issued += 1;
        if (result.emailSent) emailsSent += 1;
      } catch (error) {
        failures.push(error instanceof Error ? error.message : `Certificate ${record.id} failed.`);
      }
    }
    return Response.json({ issued, emailsSent, failures });
  } catch (error) {
    return Response.json({ code: "CERTIFICATE_BATCH_FAILED", message: error instanceof Error ? error.message : "Certificates could not be issued." }, { status: 500 });
  }
}
