import { env } from "cloudflare:workers";
import { currentDelegate, hashPassword, verifyPassword } from "../../auth/auth";

function passwordError(password?: string) {
  if (!password || password.length < 12) return "Password must contain at least 12 characters.";
  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password)) return "Password must include upper-case, lower-case and numeric characters.";
  return "";
}

export async function POST(request: Request) {
  try {
    const delegate = await currentDelegate(request);
    if (!delegate) return Response.json({ code: "NOT_AUTHENTICATED", message: "Sign in to change your password." }, { status: 401 });
    const payload = await request.json() as { currentPassword?: string; newPassword?: string };
    if (!payload.currentPassword) return Response.json({ code: "CURRENT_PASSWORD_REQUIRED", message: "Enter your current password." }, { status: 400 });
    const invalid = passwordError(payload.newPassword);
    if (invalid) return Response.json({ code: "WEAK_PASSWORD", message: invalid }, { status: 400 });
    if (payload.currentPassword === payload.newPassword) return Response.json({ code: "PASSWORD_UNCHANGED", message: "Choose a password different from your current password." }, { status: 400 });
    const account = await env.DB.prepare(
      "SELECT password_hash, password_salt FROM delegate_auth_accounts WHERE delegate_id = ?",
    ).bind(delegate.id).first<{ password_hash: string; password_salt: string }>();
    if (!account || !await verifyPassword(payload.currentPassword, account.password_salt, account.password_hash)) {
      return Response.json({ code: "INCORRECT_PASSWORD", message: "The current password is incorrect." }, { status: 401 });
    }
    const { hash, salt } = await hashPassword(payload.newPassword!);
    const now = new Date().toISOString();
    await env.DB.batch([
      env.DB.prepare(
        "UPDATE delegate_auth_accounts SET password_hash = ?, password_salt = ?, failed_attempts = 0, locked_until = NULL, password_updated_at = ?, updated_at = ? WHERE delegate_id = ?",
      ).bind(hash, salt, now, now, delegate.id),
      env.DB.prepare("DELETE FROM delegate_auth_sessions WHERE delegate_id = ? AND id != ?").bind(delegate.id, delegate.sessionId),
    ]);
    return Response.json({ changed: true });
  } catch (error) {
    return Response.json({ code: "PASSWORD_CHANGE_FAILED", message: error instanceof Error ? error.message : "Your password could not be changed." }, { status: 500 });
  }
}
