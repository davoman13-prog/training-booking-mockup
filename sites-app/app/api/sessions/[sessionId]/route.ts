import { eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { sessions } from "../../../../db/schema";
import {
  SessionPayload,
  sessionValues,
  validateSessionPayload,
} from "../sessionPayload";

interface RouteContext {
  params: Promise<{ sessionId: string }>;
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    const { sessionId } = await context.params;
    const payload = (await request.json()) as SessionPayload;
    const validationError = validateSessionPayload(payload);
    if (validationError) {
      return Response.json({ code: "INVALID_SESSION", message: validationError }, { status: 400 });
    }

    const [session] = await getDb()
      .update(sessions)
      .set(sessionValues(payload))
      .where(eq(sessions.id, sessionId))
      .returning();

    if (!session) {
      return Response.json(
        { code: "SESSION_NOT_FOUND", message: "The session was not found." },
        { status: 404 },
      );
    }

    return Response.json({ session });
  } catch (error) {
    return Response.json(
      {
        code: "SESSION_UPDATE_FAILED",
        message: error instanceof Error ? error.message : "The session could not be updated.",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { sessionId } = await context.params;
    const [existing] = await getDb()
      .select({ attendeeCount: sessions.attendeeCount })
      .from(sessions)
      .where(eq(sessions.id, sessionId))
      .limit(1);

    if (!existing) {
      return Response.json(
        { code: "SESSION_NOT_FOUND", message: "The session was not found." },
        { status: 404 },
      );
    }
    if (existing.attendeeCount > 0) {
      return Response.json(
        {
          code: "SESSION_HAS_BOOKINGS",
          message: "This session cannot be removed because it has booked delegates.",
        },
        { status: 409 },
      );
    }

    await getDb()
      .delete(sessions)
      .where(eq(sessions.id, sessionId));

    return Response.json({ deleted: true, sessionId });
  } catch (error) {
    return Response.json(
      {
        code: "SESSION_DELETE_FAILED",
        message: error instanceof Error ? error.message : "The session could not be removed.",
      },
      { status: 500 },
    );
  }
}
