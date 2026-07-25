import { env } from "cloudflare:workers";
import { createAndSendCode, emailDeliveryConfigured } from "../email";

export async function POST(request: Request) {
  try {
    if (!emailDeliveryConfigured()) {
      return Response.json({ code: "EMAIL_NOT_CONFIGURED", message: "Password recovery email is not yet available. Please contact Kalu Training." }, { status: 503 });
    }
    const payload = await request.json() as { email?: string };
    const email = payload.email?.trim().toLowerCase();
    if (!email) return Response.json({ code: "EMAIL_REQUIRED", message: "Enter your email address." }, { status: 400 });

    const admin = await env.DB.prepare(
      "SELECT id, first_name, email FROM users WHERE email = ? AND role = 'Admin' AND is_active = 1",
    ).bind(email).first<{ id: string; first_name: string; email: string }>();
    const delegate = admin ? null : await env.DB.prepare(
      "SELECT id, first_name, email FROM delegates WHERE email = ? AND account_status = 'active'",
    ).bind(email).first<{ id: string; first_name: string; email: string }>();
    const account = admin ?? delegate;
    if (account) {
      try {
        await createAndSendCode({
          accountType: admin ? "admin" : "delegate",
          accountId: account.id,
          email: account.email,
          name: account.first_name,
          purpose: "reset_password",
        });
      } catch (error) {
        console.error("Password reset email delivery failed.", error);
      }
    }
    return Response.json({ message: "If an active account uses that email address, a password reset code has been sent." });
  } catch (error) {
    console.error("Password reset request failed.", error);
    return Response.json({ message: "If an active account uses that email address, a password reset code has been sent." });
  }
}
