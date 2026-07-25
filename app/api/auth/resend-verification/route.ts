import { env } from "cloudflare:workers";
import { createAndSendCode, emailDeliveryConfigured } from "../email";

export async function POST(request: Request) {
  try {
    if (!emailDeliveryConfigured()) {
      return Response.json({ code: "EMAIL_NOT_CONFIGURED", message: "Email delivery is not yet available." }, { status: 503 });
    }
    const payload = await request.json() as { email?: string };
    const email = payload.email?.trim().toLowerCase();
    if (!email) return Response.json({ code: "EMAIL_REQUIRED", message: "Enter your email address." }, { status: 400 });
    const account = await env.DB.prepare(
      `SELECT d.id, d.first_name, d.email, a.email_verified_at
       FROM delegates d JOIN delegate_auth_accounts a ON a.delegate_id = d.id WHERE d.email = ?`,
    ).bind(email).first<{ id: string; first_name: string; email: string; email_verified_at: string | null }>();
    if (account && !account.email_verified_at) {
      await createAndSendCode({ accountType: "delegate", accountId: account.id, email: account.email, name: account.first_name, purpose: "verify_email" });
    }
    return Response.json({ message: "If that account needs verification, a new code has been sent." });
  } catch (error) {
    const message = error instanceof Error ? error.message : "A new code could not be sent.";
    return Response.json({ code: "CODE_SEND_FAILED", message }, { status: message.includes("one minute") ? 429 : 500 });
  }
}
