import { currentAdmin, currentDelegate } from "../auth";

export async function GET(request: Request) {
  const user = await currentAdmin(request) ?? await currentDelegate(request);
  if (!user) return Response.json({ authenticated: false }, { status: 401 });
  return Response.json({ authenticated: true, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
}
