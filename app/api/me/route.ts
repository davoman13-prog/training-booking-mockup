import { eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { users } from "../../../db/schema";

const USER_EMAIL_HEADER = "oai-authenticated-user-email";

export async function GET(request: Request) {
  const email = request.headers.get(USER_EMAIL_HEADER)?.trim().toLowerCase();

  if (!email) {
    return Response.json(
      {
        code: "NOT_AUTHENTICATED",
        message: "You must sign in before using the training portal.",
      },
      { status: 401 },
    );
  }

  const db = getDb();
  await db
    .insert(users)
    .values({ id: crypto.randomUUID(), email })
    .onConflictDoNothing({ target: users.email });

  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

  if (!user?.isActive || user.isAnonymised) {
    return Response.json(
      {
        code: "ACCOUNT_UNAVAILABLE",
        message: "This account is not currently available.",
      },
      { status: 403 },
    );
  }

  return Response.json({
    ...user,
    profileComplete: Boolean(user.firstName && user.lastName),
  });
}
