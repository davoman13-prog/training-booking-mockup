import { getDb } from "../../../db";
import { sessions } from "../../../db/schema";
import {
  SessionPayload,
  sessionValues,
  validateSessionPayload,
} from "./sessionPayload";
import { requireAdmin } from "../auth/auth";

export async function POST(request: Request) {
  const denied = await requireAdmin(request); if (denied) return denied;
  try {
    const payload = (await request.json()) as SessionPayload;
    const validationError = validateSessionPayload(payload);
    if (validationError) {
      return Response.json({ code: "INVALID_SESSION", message: validationError }, { status: 400 });
    }

    const [session] = await getDb()
      .insert(sessions)
      .values({
        id: `session-${crypto.randomUUID()}`,
        ...sessionValues(payload),
        createdAt: new Date().toISOString(),
      })
      .returning();

    return Response.json({ session }, { status: 201 });
  } catch (error) {
    return Response.json(
      {
        code: "SESSION_CREATE_FAILED",
        message: error instanceof Error ? error.message : "The session could not be created.",
      },
      { status: 500 },
    );
  }
}
