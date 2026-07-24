import { env } from "cloudflare:workers";
import { currentDelegate } from "../../auth/auth";

interface ProfilePayload {
  firstName?: string; lastName?: string; phone?: string; organisation?: string;
  managerName?: string; managerEmail?: string; specialRequirements?: string;
}

function validate(payload: ProfilePayload) {
  if (!payload.firstName?.trim() || !payload.lastName?.trim()) return "First name and last name are required.";
  if (!payload.organisation?.trim()) return "Practice or organisation is required.";
  if (!payload.managerName?.trim()) return "Practice manager name is required.";
  if (!payload.managerEmail?.trim() || !payload.managerEmail.includes("@")) return "A valid practice manager email is required.";
  return "";
}

export async function GET(request: Request) {
  const delegate = await currentDelegate(request);
  if (!delegate) return Response.json({ code: "NOT_AUTHENTICATED", message: "Sign in to view your profile." }, { status: 401 });
  const profile = await env.DB.prepare(
    `SELECT id, first_name, last_name, email, phone, organisation, manager_name, manager_email, special_requirements
     FROM delegates WHERE id = ?`,
  ).bind(delegate.id).first();
  return profile ? Response.json({ profile }) : Response.json({ code: "PROFILE_NOT_FOUND", message: "Your profile was not found." }, { status: 404 });
}

export async function PUT(request: Request) {
  try {
    const delegate = await currentDelegate(request);
    if (!delegate) return Response.json({ code: "NOT_AUTHENTICATED", message: "Sign in to update your profile." }, { status: 401 });
    const payload = await request.json() as ProfilePayload;
    const error = validate(payload);
    if (error) return Response.json({ code: "INVALID_PROFILE", message: error }, { status: 400 });
    const now = new Date().toISOString();
    await env.DB.prepare(
      `UPDATE delegates SET first_name = ?, last_name = ?, phone = ?, organisation = ?, manager_name = ?,
       manager_email = ?, special_requirements = ?, updated_at = ? WHERE id = ?`,
    ).bind(
      payload.firstName!.trim(), payload.lastName!.trim(), payload.phone?.trim() || null,
      payload.organisation!.trim(), payload.managerName!.trim(), payload.managerEmail!.trim().toLowerCase(),
      payload.specialRequirements?.trim() || "", now, delegate.id,
    ).run();
    const profile = await env.DB.prepare(
      `SELECT id, first_name, last_name, email, phone, organisation, manager_name, manager_email, special_requirements
       FROM delegates WHERE id = ?`,
    ).bind(delegate.id).first();
    return Response.json({ profile });
  } catch (error) {
    return Response.json({ code: "PROFILE_UPDATE_FAILED", message: error instanceof Error ? error.message : "Your profile could not be updated." }, { status: 500 });
  }
}
