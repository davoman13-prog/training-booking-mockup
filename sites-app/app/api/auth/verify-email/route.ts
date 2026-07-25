import { env } from "cloudflare:workers";
import { createDelegateSession } from "../auth";
import { consumeCode } from "../email";

export async function POST(request: Request) {
  try {
    const payload = await request.json() as { email?: string; code?: string };
    const email = payload.email?.trim().toLowerCase();
    const code = payload.code?.trim();
    if (!email || !/^\d{6}$/.test(code ?? "")) {
      return Response.json({ code: "INVALID_CODE", message: "Enter your email address and six-digit code." }, { status: 400 });
    }
    const account = await env.DB.prepare(
      `SELECT d.id, d.first_name, d.last_name, d.email, a.email_verified_at
       FROM delegates d JOIN delegate_auth_accounts a ON a.delegate_id = d.id WHERE d.email = ?`,
    ).bind(email).first<{ id: string; first_name: string; last_name: string; email: string; email_verified_at: string | null }>();
    if (!account) return Response.json({ code: "INVALID_CODE", message: "The code is invalid or has expired." }, { status: 400 });
    if (!account.email_verified_at) {
      const valid = await consumeCode({ accountType: "delegate", accountId: account.id, purpose: "verify_email", code: code! });
      if (!valid) return Response.json({ code: "INVALID_CODE", message: "The code is invalid or has expired." }, { status: 400 });
      await env.DB.prepare("UPDATE delegate_auth_accounts SET email_verified_at = ?, updated_at = ? WHERE delegate_id = ?")
        .bind(new Date().toISOString(), new Date().toISOString(), account.id).run();
    }
    const session = await createDelegateSession(account.id);
    return Response.json(
      { user: { id: account.id, name: `${account.first_name} ${account.last_name}`.trim(), email: account.email, role: "delegate" } },
      { headers: { "Set-Cookie": session.cookie } },
    );
  } catch (error) {
    return Response.json({ code: "VERIFICATION_FAILED", message: error instanceof Error ? error.message : "Email verification could not be completed." }, { status: 500 });
  }
}
