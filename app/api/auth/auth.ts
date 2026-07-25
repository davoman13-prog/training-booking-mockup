import { env } from "cloudflare:workers";

const COOKIE_NAME = "kalu_delegate_session";
const ADMIN_COOKIE_NAME = "kalu_admin_session";
const SESSION_DAYS = 14;
const encoder = new TextEncoder();

function toBase64Url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function randomToken(bytes = 32) {
  return toBase64Url(crypto.getRandomValues(new Uint8Array(bytes)));
}

async function sha256(value: string) {
  return toBase64Url(new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(value))));
}

export async function hashSecurityCode(value: string) {
  return sha256(value);
}

export async function hashPassword(password: string, salt = randomToken(16)) {
  const key = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: encoder.encode(salt), iterations: 100_000 },
    key,
    256,
  );
  return { salt, hash: toBase64Url(new Uint8Array(bits)) };
}

export async function verifyPassword(password: string, salt: string, expectedHash: string) {
  const { hash } = await hashPassword(password, salt);
  if (hash.length !== expectedHash.length) return false;
  let difference = 0;
  for (let index = 0; index < hash.length; index += 1) difference |= hash.charCodeAt(index) ^ expectedHash.charCodeAt(index);
  return difference === 0;
}

function cookieValue(request: Request, name = COOKIE_NAME) {
  const cookie = request.headers.get("cookie") ?? "";
  return cookie.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${name}=`))?.slice(name.length + 1);
}

export async function createDelegateSession(delegateId: string) {
  const token = randomToken();
  const tokenHash = await sha256(token);
  const expires = new Date(Date.now() + SESSION_DAYS * 86_400_000);
  const now = new Date().toISOString();
  await env.DB.prepare(
    "INSERT INTO delegate_auth_sessions (id, delegate_id, token_hash, expires_at, last_used_at, created_at) VALUES (?, ?, ?, ?, ?, ?)",
  ).bind(`auth-session-${crypto.randomUUID()}`, delegateId, tokenHash, expires.toISOString(), now, now).run();
  return {
    cookie: `${COOKIE_NAME}=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${SESSION_DAYS * 86_400}`,
  };
}

export async function currentDelegate(request: Request) {
  const token = cookieValue(request);
  if (!token) return null;
  const tokenHash = await sha256(token);
  const row = await env.DB.prepare(
    `SELECT d.id, d.first_name, d.last_name, d.email, d.account_status, s.id AS session_id
     FROM delegate_auth_sessions s JOIN delegates d ON d.id = s.delegate_id
     WHERE s.token_hash = ? AND s.expires_at > ?`,
  ).bind(tokenHash, new Date().toISOString()).first<{
    id: string; first_name: string; last_name: string; email: string; account_status: string; session_id: string;
  }>();
  if (!row || row.account_status !== "active") return null;
  await env.DB.prepare("UPDATE delegate_auth_sessions SET last_used_at = ? WHERE id = ?")
    .bind(new Date().toISOString(), row.session_id).run();
  return { id: row.id, name: `${row.first_name} ${row.last_name}`.trim(), email: row.email, role: "delegate" as const, sessionId: row.session_id };
}

export async function revokeDelegateSession(request: Request) {
  const token = cookieValue(request);
  if (token) await env.DB.prepare("DELETE FROM delegate_auth_sessions WHERE token_hash = ?").bind(await sha256(token)).run();
  return `${COOKIE_NAME}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`;
}

export async function createAdminSession(userId: string) {
  const token = randomToken();
  const tokenHash = await sha256(token);
  const expires = new Date(Date.now() + SESSION_DAYS * 86_400_000);
  const now = new Date().toISOString();
  await env.DB.prepare(
    "INSERT INTO admin_auth_sessions (id, user_id, token_hash, expires_at, last_used_at, created_at) VALUES (?, ?, ?, ?, ?, ?)",
  ).bind(`admin-session-${crypto.randomUUID()}`, userId, tokenHash, expires.toISOString(), now, now).run();
  return { cookie: `${ADMIN_COOKIE_NAME}=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${SESSION_DAYS * 86_400}` };
}

export async function currentAdmin(request: Request) {
  const token = cookieValue(request, ADMIN_COOKIE_NAME);
  if (!token) return null;
  const row = await env.DB.prepare(
    `SELECT u.id, u.first_name, u.last_name, u.email, u.role, u.is_active, s.id AS session_id
     FROM admin_auth_sessions s JOIN users u ON u.id = s.user_id
     WHERE s.token_hash = ? AND s.expires_at > ?`,
  ).bind(await sha256(token), new Date().toISOString()).first<{
    id: string; first_name: string; last_name: string; email: string; role: string; is_active: number; session_id: string;
  }>();
  if (!row || row.role !== "Admin" || !row.is_active) return null;
  await env.DB.prepare("UPDATE admin_auth_sessions SET last_used_at = ? WHERE id = ?").bind(new Date().toISOString(), row.session_id).run();
  return { id: row.id, name: `${row.first_name} ${row.last_name}`.trim() || "Kalu Administrator", email: row.email, role: "admin" as const };
}

export async function revokeAdminSession(request: Request) {
  const token = cookieValue(request, ADMIN_COOKIE_NAME);
  if (token) await env.DB.prepare("DELETE FROM admin_auth_sessions WHERE token_hash = ?").bind(await sha256(token)).run();
  return `${ADMIN_COOKIE_NAME}=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`;
}

export async function requireAdmin(request: Request) {
  const admin = await currentAdmin(request);
  return admin ? null : Response.json(
    { code: "ADMIN_REQUIRED", message: "Administrator login required." },
    { status: 401 },
  );
}
