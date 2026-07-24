import { env } from "cloudflare:workers";

const COOKIE_NAME = "kalu_delegate_session";
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

export async function hashPassword(password: string, salt = randomToken(16)) {
  const key = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: encoder.encode(salt), iterations: 210_000 },
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

function cookieValue(request: Request) {
  const cookie = request.headers.get("cookie") ?? "";
  return cookie.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${COOKIE_NAME}=`))?.slice(COOKIE_NAME.length + 1);
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
