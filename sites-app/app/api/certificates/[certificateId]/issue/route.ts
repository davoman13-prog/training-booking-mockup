import { requireAdmin } from "../../../auth/auth";
import { issueCertificate } from "../../issueCertificate";

interface RouteContext { params: Promise<{ certificateId: string }> }

export async function POST(request: Request, context: RouteContext) {
  const denied = await requireAdmin(request); if (denied) return denied;
  try {
    const { certificateId } = await context.params;
    return Response.json(await issueCertificate(certificateId));
  } catch (error) {
    return Response.json({ code: "CERTIFICATE_ISSUE_FAILED", message: error instanceof Error ? error.message : "The certificate could not be issued." }, { status: 409 });
  }
}
