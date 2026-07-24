import { getDb } from "../../../db";
import { trainers } from "../../../db/schema";
import { TrainerPayload, trainerValues, validateTrainerPayload } from "./trainerPayload";
import { requireAdmin } from "../auth/auth";

export async function POST(request: Request) {
  const denied = await requireAdmin(request); if (denied) return denied;
  try {
    const payload = (await request.json()) as TrainerPayload;
    const validationError = validateTrainerPayload(payload);
    if (validationError) return Response.json({ message: validationError }, { status: 400 });
    const [trainer] = await getDb().insert(trainers).values({
      id: `trainer-${crypto.randomUUID()}`, ...trainerValues(payload),
      createdAt: new Date().toISOString(),
    }).returning();
    return Response.json({ trainer }, { status: 201 });
  } catch (error) {
    return Response.json({ message: error instanceof Error ? error.message : "The trainer could not be created." }, { status: 500 });
  }
}
