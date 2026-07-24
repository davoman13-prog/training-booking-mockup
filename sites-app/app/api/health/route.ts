import { getDb } from "../../../db";
import { users } from "../../../db/schema";

export async function GET() {
  try {
    await getDb().select({ id: users.id }).from(users).limit(1);

    return Response.json({
      status: "healthy",
      database: "connected",
      platform: "OpenAI Sites",
      timestampUtc: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    return Response.json(
      {
        status: "unhealthy",
        database: "unavailable",
        message,
        timestampUtc: new Date().toISOString(),
      },
      { status: 503 },
    );
  }
}
