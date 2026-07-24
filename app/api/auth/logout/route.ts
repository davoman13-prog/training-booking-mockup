import { revokeDelegateSession } from "../auth";

export async function POST(request: Request) {
  const cookie = await revokeDelegateSession(request);
  return Response.json({ loggedOut: true }, { headers: { "Set-Cookie": cookie } });
}
