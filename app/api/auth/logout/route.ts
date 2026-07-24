import { revokeAdminSession, revokeDelegateSession } from "../auth";

export async function POST(request: Request) {
  const headers = new Headers();
  headers.append("Set-Cookie", await revokeDelegateSession(request));
  headers.append("Set-Cookie", await revokeAdminSession(request));
  return Response.json({ loggedOut: true }, { headers });
}
