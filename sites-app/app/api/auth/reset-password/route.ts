import { env } from "cloudflare:workers";
import { hashPassword } from "../auth";
import { consumeCode } from "../email";

function passwordError(password?: string) {
  if (!password || password.length < 12) return "Password must contain at least 12 characters.";
  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password)) return "Password must include upper-case, lower-case and numeric characters.";
  return "";
}

export async function POST(request: Request) {
  try {
    const payload = await request.json() as { email?: string; code?: string; password?: string };
    const email = payload.email?.trim().toLowerCase();
    const code = payload.code?.trim();
    if (!email || !/^\d{6}$/.test(code ?? "")) {
      return Response.json({ code: "INVALID_CODE", message: "Enter your email address and six-digit code." }, { status: 400 });
    }
    const invalidPassword = passwordError(payload.password);
    if (invalidPassword) return Response.json({ code: "WEAK_PASSWORD", message: invalidPassword }, { status: 400 });

    const admin = await env.DB.prepare(
      "SELECT id FROM users WHERE email = ? AND role = 'Admin' AND is_active = 1",
    ).bind(email).first<{ id: string }>();
    const delegate = admin ? null : await env.DB.prepare(
      "SELECT id FROM delegates WHERE email = ? AND account_status = 'active'",
    ).bind(email).first<{ id: string }>();
    const account = admin ?? delegate;
    const accountType = admin ? "admin" : "delegate";
    if (!account || !await consumeCode({ accountType, accountId: account.id, purpose: "reset_password", code: code! })) {
      return Response.json({ code: "INVALID_CODE", message: "The code is invalid or has expired." }, { status: 400 });
    }

    const { hash, salt } = await hashPassword(payload.password!);
    const now = new Date().toISOString();
    if (admin) {
      await env.DB.batch([
        env.DB.prepare("UPDATE admin_auth_accounts SET password_hash = ?, password_salt = ?, failed_attempts = 0, locked_until = NULL, password_updated_at = ?, updated_at = ? WHERE user_id = ?")
          .bind(hash, salt, now, now, account.id),
        env.DB.prepare("DELETE FROM admin_auth_sessions WHERE user_id = ?").bind(account.id),
      ]);
    } else {
      await env.DB.batch([
        env.DB.prepare("UPDATE delegate_auth_accounts SET password_hash = ?, password_salt = ?, failed_attempts = 0, locked_until = NULL, password_updated_at = ?, updated_at = ? WHERE delegate_id = ?")
          .bind(hash, salt, now, now, account.id),
        env.DB.prepare("DELETE FROM delegate_auth_sessions WHERE delegate_id = ?").bind(account.id),
      ]);
    }
    return Response.json({ message: "Your password has been changed. You can now sign in." });
  } catch (error) {
    return Response.json({ code: "RESET_FAILED", message: error instanceof Error ? error.message : "The password could not be changed." }, { status: 500 });
  }
}
