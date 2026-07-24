import { eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { delegates } from "../../../../db/schema";

const USER_EMAIL_HEADER = "oai-authenticated-user-email";

export async function GET(request: Request) {
  const email = request.headers.get(USER_EMAIL_HEADER)?.trim().toLowerCase();
  if (!email) {
    return Response.json({ authenticated: false, registered: false }, { status: 401 });
  }

  const [delegate] = await getDb().select().from(delegates).where(eq(delegates.email, email)).limit(1);
  if (!delegate) {
    return Response.json({ authenticated: true, registered: false, email });
  }
  if (delegate.accountStatus !== "active") {
    return Response.json(
      { authenticated: true, registered: true, code: "ACCOUNT_UNAVAILABLE", message: "This delegate account is not currently active." },
      { status: 403 },
    );
  }

  return Response.json({
    authenticated: true,
    registered: true,
    user: {
      id: delegate.id,
      name: `${delegate.firstName} ${delegate.lastName}`.trim(),
      email: delegate.email,
      role: "delegate",
    },
  });
}
