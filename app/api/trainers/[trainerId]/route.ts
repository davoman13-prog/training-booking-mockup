import { eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { sessions, trainers } from "../../../../db/schema";
import { TrainerPayload, trainerValues, validateTrainerPayload } from "../trainerPayload";

interface RouteContext { params: Promise<{ trainerId: string }> }

export async function PUT(request: Request, context: RouteContext) {
  try {
    const { trainerId } = await context.params;
    const payload = (await request.json()) as TrainerPayload;
    const validationError = validateTrainerPayload(payload);
    if (validationError) return Response.json({ message: validationError }, { status: 400 });
    const [trainer] = await getDb().update(trainers).set(trainerValues(payload)).where(eq(trainers.id, trainerId)).returning();
    if (!trainer) return Response.json({ message: "The trainer was not found." }, { status: 404 });
    return Response.json({ trainer });
  } catch (error) {
    return Response.json({ message: error instanceof Error ? error.message : "The trainer could not be updated." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { trainerId } = await context.params;
    const linked = await getDb().select({ id: sessions.id }).from(sessions)
      .where(eq(sessions.trainerId, trainerId)).limit(1);
    if (linked.length) {
      return Response.json({ message: "This trainer cannot be removed while sessions are linked to them. Mark the trainer inactive instead." }, { status: 409 });
    }
    await getDb().delete(trainers).where(eq(trainers.id, trainerId));
    return Response.json({ deleted: true, trainerId });
  } catch (error) {
    return Response.json({ message: error instanceof Error ? error.message : "The trainer could not be removed." }, { status: 500 });
  }
}
