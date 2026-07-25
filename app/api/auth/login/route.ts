import { env } from "cloudflare:workers";
import { createAdminSession, createDelegateSession, verifyPassword } from "../auth";

const MAX_ATTEMPTS = 5;
const LOCK_MINUTES = 15;

export async function POST(request: Request) {
  try {
    const payload = await request.json() as { email?: string; password?: string };
    const email = payload.email?.trim().toLowerCase();
    if (!email || !payload.password) return Response.json({ code: "INVALID_LOGIN", message: "Enter your email address and password." }, { status: 400 });
    const genericError = { code: "INVALID_CREDENTIALS", message: "The email address or password is incorrect." };

    const admin = await env.DB.prepare(
      `SELECT u.id, u.first_name, u.last_name, u.email, u.role, u.is_active,
              a.password_hash, a.password_salt, a.failed_attempts, a.locked_until
       FROM users u JOIN admin_auth_accounts a ON a.user_id = u.id WHERE u.email = ?`,
    ).bind(email).first<{
      id: string; first_name: string; last_name: string; email: string; role: string; is_active: number;
      password_hash: string; password_salt: string; failed_attempts: number; locked_until: string | null;
    }>();
    if (admin) {
      if (admin.locked_until && admin.locked_until > new Date().toISOString()) {
        return Response.json({ code: "ACCOUNT_LOCKED", message: "This account is temporarily locked after repeated unsuccessful attempts. Try again in 15 minutes." }, { status: 429 });
      }
      const valid = await verifyPassword(payload.password, admin.password_salt, admin.password_hash);
      if (!valid) {
        const attempts = admin.failed_attempts + 1;
        const lockedUntil = attempts >= MAX_ATTEMPTS ? new Date(Date.now() + LOCK_MINUTES * 60_000).toISOString() : null;
        await env.DB.prepare("UPDATE admin_auth_accounts SET failed_attempts = ?, locked_until = ?, updated_at = ? WHERE user_id = ?")
          .bind(attempts >= MAX_ATTEMPTS ? 0 : attempts, lockedUntil, new Date().toISOString(), admin.id).run();
        return Response.json(genericError, { status: 401 });
      }
      if (admin.role !== "Admin" || !admin.is_active) return Response.json({ code: "ACCOUNT_UNAVAILABLE", message: "This account is not currently active." }, { status: 403 });
      await env.DB.prepare("UPDATE admin_auth_accounts SET failed_attempts = 0, locked_until = NULL, updated_at = ? WHERE user_id = ?")
        .bind(new Date().toISOString(), admin.id).run();
      const session = await createAdminSession(admin.id);
      return Response.json(
        { user: { id: admin.id, name: `${admin.first_name} ${admin.last_name}`.trim(), email: admin.email, role: "admin" } },
        { headers: { "Set-Cookie": session.cookie } },
      );
    }

    const account = await env.DB.prepare(
      `SELECT d.id, d.first_name, d.last_name, d.email, d.account_status, a.password_hash, a.password_salt, a.failed_attempts, a.locked_until, a.email_verified_at
       FROM delegates d JOIN delegate_auth_accounts a ON a.delegate_id = d.id WHERE d.email = ?`,
    ).bind(email).first<{
      id: string; first_name: string; last_name: string; email: string; account_status: string;
      password_hash: string; password_salt: string; failed_attempts: number; locked_until: string | null; email_verified_at: string | null;
    }>();
    if (!account) return Response.json(genericError, { status: 401 });
    if (!account.email_verified_at) {
      return Response.json({ code: "EMAIL_NOT_VERIFIED", message: "Confirm your email address before signing in.", requiresVerification: true, email }, { status: 403 });
    }
    if (account.locked_until && account.locked_until > new Date().toISOString()) {
      return Response.json({ code: "ACCOUNT_LOCKED", message: "This account is temporarily locked after repeated unsuccessful attempts. Try again in 15 minutes." }, { status: 429 });
    }
    const valid = await verifyPassword(payload.password, account.password_salt, account.password_hash);
    if (!valid) {
      const attempts = account.failed_attempts + 1;
      const lockedUntil = attempts >= MAX_ATTEMPTS ? new Date(Date.now() + LOCK_MINUTES * 60_000).toISOString() : null;
      await env.DB.prepare("UPDATE delegate_auth_accounts SET failed_attempts = ?, locked_until = ?, updated_at = ? WHERE delegate_id = ?")
        .bind(attempts >= MAX_ATTEMPTS ? 0 : attempts, lockedUntil, new Date().toISOString(), account.id).run();
      return Response.json(genericError, { status: 401 });
    }
    if (account.account_status !== "active") return Response.json({ code: "ACCOUNT_UNAVAILABLE", message: "This account is not currently active." }, { status: 403 });
    await env.DB.prepare("UPDATE delegate_auth_accounts SET failed_attempts = 0, locked_until = NULL, updated_at = ? WHERE delegate_id = ?")
      .bind(new Date().toISOString(), account.id).run();
    const session = await createDelegateSession(account.id);
    return Response.json(
      { user: { id: account.id, name: `${account.first_name} ${account.last_name}`.trim(), email: account.email, role: "delegate" } },
      { headers: { "Set-Cookie": session.cookie } },
    );
  } catch (error) {
    return Response.json({ code: "LOGIN_FAILED", message: error instanceof Error ? error.message : "Login could not be completed." }, { status: 500 });
  }
}
