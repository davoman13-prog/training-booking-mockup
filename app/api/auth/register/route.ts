import { env } from "cloudflare:workers";
import { createDelegateSession, hashPassword } from "../auth";
import { DelegatePayload, validateDelegatePayload } from "../../delegates/delegatePayload";

interface RegistrationPayload extends DelegatePayload { password?: string; termsAccepted?: boolean }

function passwordError(password?: string) {
  if (!password || password.length < 12) return "Password must contain at least 12 characters.";
  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password)) return "Password must include upper-case, lower-case and numeric characters.";
  return "";
}

export async function POST(request: Request) {
  try {
    const payload = await request.json() as RegistrationPayload;
    const profileError = validateDelegatePayload(payload);
    if (profileError) return Response.json({ code: "INVALID_REGISTRATION", message: profileError }, { status: 400 });
    const invalidPassword = passwordError(payload.password);
    if (invalidPassword) return Response.json({ code: "WEAK_PASSWORD", message: invalidPassword }, { status: 400 });
    if (!payload.termsAccepted) return Response.json({ code: "TERMS_REQUIRED", message: "Accept the registration terms to continue." }, { status: 400 });

    const id = `delegate-${crypto.randomUUID()}`;
    const now = new Date().toISOString();
    const { salt, hash } = await hashPassword(payload.password!);
    await env.DB.batch([
      env.DB.prepare(
        `INSERT INTO delegates (id, first_name, last_name, email, phone, organisation, manager_name, manager_email, account_status, admin_notes, special_requirements, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', '', '', ?, ?)`,
      ).bind(id, payload.firstName!.trim(), payload.lastName!.trim(), payload.email!.trim().toLowerCase(), payload.phone?.trim() || null, payload.organisation!.trim(), payload.managerName!.trim(), payload.managerEmail!.trim().toLowerCase(), now, now),
      env.DB.prepare(
        `INSERT INTO delegate_auth_accounts (delegate_id, password_hash, password_salt, failed_attempts, password_updated_at, created_at, updated_at)
         VALUES (?, ?, ?, 0, ?, ?, ?)`,
      ).bind(id, hash, salt, now, now, now),
    ]);
    const session = await createDelegateSession(id);
    return Response.json(
      { user: { id, name: `${payload.firstName!.trim()} ${payload.lastName!.trim()}`, email: payload.email!.trim().toLowerCase(), role: "delegate" } },
      { status: 201, headers: { "Set-Cookie": session.cookie } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Registration could not be completed.";
    const duplicate = message.includes("UNIQUE");
    return Response.json({ code: duplicate ? "EMAIL_IN_USE" : "REGISTRATION_FAILED", message: duplicate ? "An account already exists for that email address." : message }, { status: duplicate ? 409 : 500 });
  }
}
