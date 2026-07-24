import { env } from "cloudflare:workers";

export async function GET() {
  const row = await env.DB.prepare("SELECT COUNT(*) AS count FROM admin_auth_accounts").first<{ count: number }>();
  return Response.json({ setupRequired: Number(row?.count ?? 0) === 0 });
}
