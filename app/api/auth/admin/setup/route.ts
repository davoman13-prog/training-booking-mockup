import { env } from "cloudflare:workers";
import { createAdminSession, hashPassword } from "../../auth";

function passwordError(password?: string) {
  if (!password || password.length < 12) return "Password must contain at least 12 characters.";
  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password)) return "Password must include upper-case, lower-case and numeric characters.";
  return "";
}

export async function POST(request: Request) {
  try {
    const existing = await env.DB.prepare("SELECT COUNT(*) AS count FROM admin_auth_accounts").first<{ count: number }>();
    if (Number(existing?.count ?? 0) > 0) {
      return Response.json({ code: "SETUP_COMPLETE", message: "Administrator setup has already been completed." }, { status: 409 });
    }
    const payload = await request.json() as { firstName?: string; lastName?: string; email?: string; password?: string };
    const firstName = payload.firstName?.trim();
    const lastName = payload.lastName?.trim();
    const email = payload.email?.trim().toLowerCase();
    if (!firstName || !lastName || !email || !email.includes("@")) {
      return Response.json({ code: "INVALID_ADMIN", message: "Enter the administrator's name and a valid email address." }, { status: 400 });
    }
    const invalidPassword = passwordError(payload.password);
    if (invalidPassword) return Response.json({ code: "WEAK_PASSWORD", message: invalidPassword }, { status: 400 });

    const id = `admin-${crypto.randomUUID()}`;
    const now = new Date().toISOString();
    const { salt, hash } = await hashPassword(payload.password!);
    await env.DB.batch([
      env.DB.prepare(
        `INSERT INTO users (id, email, first_name, last_name, role, is_active, is_anonymised, created_at, updated_at)
         VALUES (?, ?, ?, ?, 'Admin', 1, 0, ?, ?)`,
      ).bind(id, email, firstName, lastName, now, now),
      env.DB.prepare(
        `INSERT INTO admin_auth_accounts (user_id, password_hash, password_salt, failed_attempts, password_updated_at, created_at, updated_at)
         VALUES (?, ?, ?, 0, ?, ?, ?)`,
      ).bind(id, hash, salt, now, now, now),
    ]);
    const session = await createAdminSession(id);
    return Response.json(
      { user: { id, name: `${firstName} ${lastName}`, email, role: "admin" } },
      { status: 201, headers: { "Set-Cookie": session.cookie } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Administrator setup could not be completed.";
    const duplicate = message.includes("UNIQUE");
    return Response.json({ code: duplicate ? "SETUP_COMPLETE" : "SETUP_FAILED", message: duplicate ? "Administrator setup has already been completed." : message }, { status: duplicate ? 409 : 500 });
  }
}
