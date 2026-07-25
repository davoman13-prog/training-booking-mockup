import { env } from "cloudflare:workers";
import { hashSecurityCode } from "./auth";

const CODE_LIFETIME_MINUTES = 15;
const MAX_CODE_ATTEMPTS = 5;
const MIN_RESEND_SECONDS = 60;

type AccountType = "delegate" | "admin";
type CodePurpose = "verify_email" | "reset_password";

function configuration() {
  const values = env as unknown as Record<string, string | undefined>;
  return {
    apiKey: values.BREVO_API_KEY?.trim(),
    fromEmail: values.EMAIL_FROM_ADDRESS?.trim(),
    fromName: values.EMAIL_FROM_NAME?.trim() || "Kalu Training",
  };
}

export function emailDeliveryConfigured() {
  const config = configuration();
  return Boolean(config.apiKey && config.fromEmail);
}

function generateCode() {
  const value = crypto.getRandomValues(new Uint32Array(1))[0] % 1_000_000;
  return value.toString().padStart(6, "0");
}

async function sendEmail(to: string, subject: string, text: string, html: string) {
  const config = configuration();
  if (!config.apiKey || !config.fromEmail) throw new Error("Email delivery is not configured.");
  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "api-key": config.apiKey, "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      sender: { name: config.fromName, email: config.fromEmail },
      to: [{ email: to }],
      subject,
      textContent: text,
      htmlContent: html,
    }),
  });
  if (!response.ok) {
    console.error("Brevo delivery failed.", response.status, await response.text());
    throw new Error("The email could not be sent. Please try again later.");
  }
}

export async function createAndSendCode(details: {
  accountType: AccountType;
  accountId: string;
  email: string;
  name: string;
  purpose: CodePurpose;
}) {
  const latest = await env.DB.prepare(
    `SELECT created_at FROM auth_email_codes
     WHERE account_type = ? AND account_id = ? AND purpose = ?
     ORDER BY created_at DESC LIMIT 1`,
  ).bind(details.accountType, details.accountId, details.purpose).first<{ created_at: string }>();
  if (latest && Date.now() - new Date(latest.created_at).getTime() < MIN_RESEND_SECONDS * 1000) {
    throw new Error("Please wait one minute before requesting another code.");
  }

  const code = generateCode();
  const now = new Date();
  const expires = new Date(now.getTime() + CODE_LIFETIME_MINUTES * 60_000);
  await env.DB.batch([
    env.DB.prepare(
      `UPDATE auth_email_codes SET consumed_at = ?
       WHERE account_type = ? AND account_id = ? AND purpose = ? AND consumed_at IS NULL`,
    ).bind(now.toISOString(), details.accountType, details.accountId, details.purpose),
    env.DB.prepare(
      `INSERT INTO auth_email_codes
       (id, account_type, account_id, purpose, code_hash, expires_at, attempts, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 0, ?)`,
    ).bind(`email-code-${crypto.randomUUID()}`, details.accountType, details.accountId, details.purpose, await hashSecurityCode(code), expires.toISOString(), now.toISOString()),
  ]);

  const action = details.purpose === "verify_email" ? "confirm your email address" : "reset your password";
  await sendEmail(
    details.email,
    details.purpose === "verify_email" ? "Your Kalu Training verification code" : "Your Kalu Training password reset code",
    `Hello ${details.name},\n\nYour code to ${action} is ${code}.\n\nIt expires in ${CODE_LIFETIME_MINUTES} minutes. If you did not request this, you can ignore this email.`,
    `<p>Hello ${details.name},</p><p>Your code to ${action} is:</p><p style="font-size:28px;font-weight:700;letter-spacing:6px">${code}</p><p>It expires in ${CODE_LIFETIME_MINUTES} minutes. If you did not request this, you can ignore this email.</p>`,
  );
}

export async function consumeCode(details: {
  accountType: AccountType;
  accountId: string;
  purpose: CodePurpose;
  code: string;
}) {
  const row = await env.DB.prepare(
    `SELECT id, code_hash, expires_at, attempts FROM auth_email_codes
     WHERE account_type = ? AND account_id = ? AND purpose = ? AND consumed_at IS NULL
     ORDER BY created_at DESC LIMIT 1`,
  ).bind(details.accountType, details.accountId, details.purpose).first<{
    id: string; code_hash: string; expires_at: string; attempts: number;
  }>();
  if (!row || row.expires_at <= new Date().toISOString() || row.attempts >= MAX_CODE_ATTEMPTS) return false;
  const valid = await hashSecurityCode(details.code) === row.code_hash;
  if (!valid) {
    await env.DB.prepare("UPDATE auth_email_codes SET attempts = attempts + 1 WHERE id = ?").bind(row.id).run();
    return false;
  }
  await env.DB.prepare("UPDATE auth_email_codes SET consumed_at = ? WHERE id = ?").bind(new Date().toISOString(), row.id).run();
  return true;
}
