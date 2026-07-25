import { env } from "cloudflare:workers";
import { currentAdmin, currentDelegate } from "../../../auth/auth";

interface RouteContext { params: Promise<{ certificateId: string }> }

export async function GET(request: Request, context: RouteContext) {
  const { certificateId } = await context.params;
  const admin = await currentAdmin(request);
  const delegate = admin ? null : await currentDelegate(request);
  if (!admin && !delegate) return Response.json({ code: "NOT_AUTHENTICATED", message: "Sign in to download this certificate." }, { status: 401 });
  const certificate = await env.DB.prepare(
    "SELECT file_key, delegate_id, status FROM certificates WHERE id = ?",
  ).bind(certificateId).first<{ file_key: string | null; delegate_id: string; status: string }>();
  if (!certificate || (!admin && certificate.delegate_id !== delegate!.id)) {
    return Response.json({ code: "CERTIFICATE_NOT_FOUND", message: "The certificate was not found." }, { status: 404 });
  }
  if (!certificate.file_key || !["issued", "available"].includes(certificate.status)) {
    return Response.json({ code: "CERTIFICATE_UNAVAILABLE", message: "The certificate PDF is not available yet." }, { status: 409 });
  }
  const object = await (env as unknown as { FILES: R2Bucket }).FILES.get(certificate.file_key);
  if (!object) return Response.json({ code: "CERTIFICATE_FILE_NOT_FOUND", message: "The certificate PDF could not be found." }, { status: 404 });
  return new Response(object.body, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": object.httpMetadata?.contentDisposition ?? `attachment; filename="${certificateId}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
